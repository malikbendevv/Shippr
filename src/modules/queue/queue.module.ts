import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { EmailConsumer } from './consumers/email.consumer';
import { MailModule } from '../mail/mail.module';
import { QueueService } from '../../shared/queue/queue.service';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'QUEUE_SERVICE',
        imports: [ConfigModule],
        useFactory: (config: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [
              config.get<string>('RABBITMQ_URL') ??
                'amqp://admin:admin123@localhost:5672',
            ],
            queue: 'main_queue',
            queueOptions: { durable: true },
            noAck: true,
            prefetchCount: 1,
            isGlobalPrefetchCount: true,
            socketOptions: {
              heartbeatIntervalInSeconds: 60,
              reconnectTimeInSeconds: 5,
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
    MailModule,
  ],
  controllers: [EmailConsumer],
  providers: [QueueService],
  exports: [QueueService],
})
export class QueueModule implements OnModuleInit {
  private readonly logger = new Logger(QueueModule.name);

  constructor(private readonly queueService: QueueService) {}

  async onModuleInit() {
    try {
      await this.queueService['client'].connect();
      this.logger.log('✅ Successfully connected to RabbitMQ');
    } catch (error) {
      this.logger.error('❌ Failed to connect to RabbitMQ:', error);
    }
  }
}
