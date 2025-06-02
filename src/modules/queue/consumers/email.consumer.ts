import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { MailService } from '../../mail/mail.service';
import { ROUTING_KEYS } from '../../../shared/queue/queue.constants';

interface WelcomeEmailPayload {
  email: string;
  name: string;
}

@Controller()
export class EmailConsumer {
  private readonly logger = new Logger(EmailConsumer.name);

  constructor(private readonly mailService: MailService) {
    this.logger.log('EmailConsumer initialized');
  }

  @EventPattern(ROUTING_KEYS.WELCOME_EMAIL)
  async handleWelcomeEmail(@Payload() data: WelcomeEmailPayload) {
    this.logger.log('Received welcome email request:', data);

    try {
      this.logger.log('Attempting to send welcome email...');
      await this.mailService.sendWelcomeEmail(data);
      this.logger.log('✅ Welcome email sent successfullyto:', data.email);
    } catch (err) {
      this.logger.error('❌ Failed to send welcome email:', err);
      // No ack = RabbitMQ will retry
    }
  }
}
