import {
  Controller,
  Post,
  Delete,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { UploadResponse } from './types';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
      fileFilter: (_req, file, callback) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
          return callback(
            new BadRequestException('Only image files are allowed!'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadResponse> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const fileUrl = this.uploadService.getFileUrl(file.filename);

    return {
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: fileUrl,
    };
  }

  @Delete('file/:filename')
  async deleteFile(
    @Param('filename') filename: string,
  ): Promise<{ message: string }> {
    try {
      await this.uploadService.deleteFile(filename);
      return { message: `File ${filename} deleted successfully` };
    } catch (error) {
      throw new NotFoundException(`File ${filename} not found`);
    }
  }
}
