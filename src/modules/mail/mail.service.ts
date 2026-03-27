import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

interface WelcomeEmailData {
  name: string;
  email: string;
}

interface PasswordResetEmailData {
  name: string;
  email: string;
  resetToken: string;
}

interface DriverDailySummaryData {
  driverEmail: string;
  driverName: string;
  date: string;
  summary: {
    totalOrders: number;
    completedOrders: number;
    totalEarnings: number;
    totalDistance: number;
  };
  orders: Array<{
    id: string;
    name: string;
    description: string | null;
    price: number;
    status: string;
    createdAt: Date;
    estimatedDistance: number | null;
    estimatedDuration: number | null;
    pickupAddress: {
      street: string | null;
      city: string | null;
      state: string | null;
    };
    dropoffAddress: {
      street: string | null;
      city: string | null;
      state: string | null;
    };
    customer: {
      firstName: string;
      lastName: string;
      email: string;
    };
  }>;
}

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  // async sendOrderConfirmation(to: string, orderDetails: any) {
  //   try {
  //     await this.mailerService.sendMail({
  //       to,
  //       subject: 'Order Confirmation',
  //       template: 'order-confirmation', // This will use order-confirmation.hbs template
  //       context: {
  //         orderDetails,
  //         customerName: orderDetails.customerName,
  //         orderNumber: orderDetails.orderNumber,
  //         total: orderDetails.total,
  //       },
  //     });
  //   } catch (error) {
  //     console.error('Error sending email:', error);
  //     throw error;
  //   }
  // }

  async sendWelcomeEmail(data: WelcomeEmailData): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: data.email,
        subject: 'Welcome to Our Platform',
        template: 'welcome',
        context: {
          name: data.name,
        },
      });
    } catch (error) {
      console.error('Error sending welcome email:', error);
      throw error;
    }
  }

  async sendPasswordResetEmail(data: PasswordResetEmailData): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: data.email,
        subject: 'Reset your password',
        template: 'password-reset',
        context: {
          name: data.name,
          resetToken: data.resetToken,
        },
      });
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  }

  async sendDriverDailySummary(data: DriverDailySummaryData): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: data.driverEmail,
        subject: `Daily Order Summary - ${data.date}`,
        template: 'driver-daily-summary',
        context: {
          driverName: data.driverName,
          date: data.date,
          summary: data.summary,
          orders: data.orders,
        },
      });
    } catch (error) {
      console.error('Error sending driver daily summary email:', error);
      throw error;
    }
  }
}
