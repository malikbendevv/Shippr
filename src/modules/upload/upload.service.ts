import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly uploadsDir = './uploads';

  constructor() {
    this.ensureUploadsDirectory();
  }

  private async ensureUploadsDirectory(): Promise<void> {
    try {
      await fs.access(this.uploadsDir);
    } catch {
      await fs.mkdir(this.uploadsDir, { recursive: true });
      this.logger.log('Created uploads directory');
    }
  }

  getFileUrl(filename: string): string {
    return join(this.uploadsDir, filename);
  }

  async deleteFile(filename: string): Promise<void> {
    try {
      await fs.unlink(join(this.uploadsDir, filename));
      this.logger.log(`Deleted file: ${filename}`);
    } catch (error) {
      this.logger.error(`Error deleting file ${filename}:`, error);
      throw error;
    }
  }
}
