import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { MailService } from '../../mail/mail.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async sendDriverDailyOrderSummary() {
    this.logger.log('Starting daily driver order summary task');

    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const startOfDay = new Date(yesterday);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(yesterday);
      endOfDay.setHours(23, 59, 59, 999);

      // Get all drivers
      const orders = await this.prisma.order.findMany({
        where: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        include: {
          driver: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
          customer: true,
          pickupAddress: true,
          dropoffAddress: true,
        },
      });

      const driverIds = new Set<string>();
      for (const order of orders) {
        if (order.driver) {
          driverIds.add(order.driver.id);
        }
      }

      await Promise.all(
        [...driverIds].map((driverId) =>
          this.executeTask('driver-daily-summary', driverId, yesterday),
        ),
      );

      this.logger.log('Daily driver order summary task completed');
    } catch (error) {
      this.logger.error('Daily driver order summary task failed:', error);
    }
  }

  async executeTask(
    taskName: 'driver-daily-summary',
    driverId: string,
    date: Date,
  ): Promise<void>;
  async executeTask(taskName: string, ...args: unknown[]): Promise<void>;
  async executeTask(taskName: string, ...args: unknown[]): Promise<void> {
    this.logger.log(`Executing task: ${taskName}`);

    try {
      switch (taskName) {
        case 'driver-daily-summary':
          return await this.sendDriverOrderSummary(
            args[0] as string,
            args[1] as Date,
          );
        default:
          throw new Error(`Unknown task: ${taskName}`);
      }
    } catch (error) {
      this.logger.error(`Task ${taskName} failed:`, error);
      throw error;
    }
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
