import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(@Inject('QUEUE_SERVICE') private readonly client: ClientProxy) {
    this.logger.log('QueueService initialized');
  }

  async emit(pattern: string, data: any) {
    this.logger.log(`Emitting message to pattern: ${pattern}`, data);
    try {
      await this.client.emit(pattern, data).toPromise();
      this.logger.log('Message emitted successfully');
    } catch (error) {
      this.logger.error('Failed to emit message:', error);
    }
  }
}
