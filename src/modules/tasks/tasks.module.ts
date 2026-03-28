import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { TasksService } from './services/tasks.services';
import { OrdersTasksService } from './services/orders-tasks.services';
// import { UserTasksService } from './services/user-tasks.service';
// import { EmailTasksService } from './services/email-tasks.service';
// import { CleanupTasksService } from './services/cleanup-tasks.service';
// import { ReportTasksService } from './services/report-tasks.service';
import { TasksController } from './controllers/tasks.controller';
import { PrismaModule } from 'src/shared/prisma/prisma.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [ScheduleModule.forRoot(), PrismaModule, MailModule],
  controllers: [TasksController],
  providers: [
    TasksService,
    OrdersTasksService,
    // UserTasksService,
    // EmailTasksService,
    // CleanupTasksService,
    // ReportTasksService,
  ],
  exports: [TasksService, OrdersTasksService],
})
export class TasksModule {}
