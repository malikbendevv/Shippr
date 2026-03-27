import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export abstract class BaseTaskService {
  public readonly logger = new Logger(BaseTaskService.name);

  protected async executeWithRetry<T>(
    taskName: string,
    taskFunction: () => Promise<T>,
    maxRetries: number = 3,
    retryDelay: number = 5000,
  ): Promise<T> {
    let lastError: Error = new Error(`${taskName} failed`);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.log(
          `Executing ${taskName} (attempt ${attempt}/${maxRetries})`,
        );
        const result = await taskFunction();
        this.logger.log(`${taskName} completed successfully`);
        return result;
      } catch (error: any) {
        if (typeof error === 'object') {
          try {
            lastError = new Error(JSON.stringify(error));
          } catch {
            lastError = new Error(String(error));
          }
        } else {
          lastError = new Error(String(error));
        }
        this.logger.error(`${taskName} failed on attempt ${attempt}:`, error);

        if (attempt < maxRetries) {
          this.logger.log(`Retrying ${taskName} in ${retryDelay}ms...`);
          await this.delay(retryDelay);
        }
      }
    }

    this.logger.error(`${taskName} failed after ${maxRetries} attempts`);
    throw lastError;
  }

  protected async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  protected getCurrentTimestamp(): string {
    return new Date().toISOString();
  }
}
