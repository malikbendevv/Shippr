import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MailModule } from '../mail/mail.module';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [MailModule, QueueModule],
  controllers: [UsersController],
  providers: [UsersService, PrismaService, JwtService, JwtAuthGuard],
})
export class UsersModule {}
