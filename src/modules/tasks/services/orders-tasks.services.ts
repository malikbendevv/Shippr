import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { MailService } from '../../mail/mail.service';
import { BaseTaskService } from './base-task-service';

interface TaskResult {
  driverId: string;
  status: 'success' | 'failed';
  error?: string;
}

@Injectable()
export class OrdersTasksService extends BaseTaskService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {
    super();
  }

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async sendDriverDailyOrderSummary() {
    await this.executeWithRetry(
      'Driver Daily Order Summary',
      async () => {
        this.logger.log('Starting daily driver order summary task');

        // Get all drivers
        const drivers = await this.prisma.user.findMany({
          where: {
            role: 'driver',
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        });

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const results: TaskResult[] = [];
        for (const driver of drivers) {
          try {
            await this.sendDriverOrderSummary(driver.id, yesterday);
            results.push({ driverId: driver.id, status: 'success' });
          } catch (error: unknown) {
            const errorMessage =
              error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(
              `Failed to send summary to driver ${driver.id}:`,
              error,
            );
            results.push({
              driverId: driver.id,
              status: 'failed',
              error: errorMessage,
            });
          }
        }

        this.logger.log(
          `Daily driver order summary task completed. Results:`,
          results,
        );
        return results;
      },
      3, // maxRetries
      5000, // retryDelay
    );
  }

  private async sendDriverOrderSummary(driverId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get driver's orders for the specified date
    const orders = await this.prisma.order.findMany({
      where: {
        driverId: driverId,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        status: true,
        createdAt: true,
        estimatedDistance: true,
        estimatedDuration: true,
        pickupAddress: {
          select: {
            street: true,
            city: true,
            state: true,
          },
        },
        dropoffAddress: {
          select: {
            street: true,
            city: true,
            state: true,
          },
        },
        customer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Get driver info
    const driver = await this.prisma.user.findUnique({
      where: { id: driverId },
      select: {
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    if (!driver) {
      throw new Error(`Driver not found: ${driverId}`);
    }

    // Calculate summary statistics
    const totalOrders = orders.length;
    const completedOrders = orders.filter(
      (order) => order.status === 'DELIVERED',
    ).length;
    const totalEarnings = orders.reduce((sum, order) => sum + order.price, 0);
    const totalDistance = orders.reduce(
      (sum, order) => sum + (order.estimatedDistance || 0),
      0,
    );

    // Send email
    await this.mailService.sendDriverDailySummary({
      driverEmail: driver.email,
      driverName: `${driver.firstName} ${driver.lastName}`,
      date: date.toLocaleDateString(),
      summary: {
        totalOrders,
        completedOrders,
        totalEarnings,
        totalDistance,
      },
      orders,
    });

    this.logger.log(`Sent daily summary to driver ${driver.email}`);
  }
}
