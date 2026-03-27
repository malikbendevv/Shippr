import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OrdersModule } from './modules/orders/orders.module';
import { UsersModule } from './modules/users/users.module';
import { PrismaService } from './shared/prisma/prisma.service';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { QueueModule } from './modules/queue/queue.module';
import { UploadModule } from './modules/upload/upload.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      {
        // Default: 100 requests per minute for all endpoints.
        // Sensitive auth endpoints override this with @Throttle().
        ttl: 60000,
        limit: 100,
      },
    ]),
    OrdersModule,
    UsersModule,
    AuthModule,
    QueueModule,
    UploadModule,
    TasksModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
