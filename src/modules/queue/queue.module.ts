import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { EmailConsumer } from './consumers/email.consumer';
import { MailModule } from '../mail/mail.module';
import { queueConfig } from '../../shared/queue/queue.config';
import { QueueService } from '../../shared/queue/queue.service';

@Module({
  imports: (() => {
    const config = queueConfig;

    return [
      ClientsModule.register([
        {
          name: 'QUEUE_SERVICE',
          transport: Transport.RMQ,
          options: {
            urls: config.urls,
            queue: config.queue,
            queueOptions: config.queueOptions,
            noAck: true,
            prefetchCount: 1,
            isGlobalPrefetchCount: true,
            socketOptions: {
              heartbeatIntervalInSeconds: 60,
              reconnectTimeInSeconds: 5,
            },
          },
        },
      ]),
      MailModule,
    ];
  })(),
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
      this.logger.error('Connection details:', queueConfig);
    }
  }
}
