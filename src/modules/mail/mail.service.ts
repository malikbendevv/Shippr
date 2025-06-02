import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

interface WelcomeEmailData {
  name: string;
  email: string;
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
}
