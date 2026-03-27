import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { TasksService } from '../services/tasks.services';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post('execute')
  async executeTask(@Body() body: { taskName: string; args?: any[] }) {
    return await this.tasksService.executeTask(
      body.taskName,
      ...(body.args || []),
    );
  }

  @Post('driver-summary/:driverId')
  async sendDriverSummary(
    @Param('driverId') driverId: string,
    @Body() body: { date?: string },
  ) {
    const date = body.date ? new Date(body.date) : new Date();
    date.setDate(date.getDate() - 1); // Default to yesterday
    return await this.tasksService.executeTask(
      'driver-daily-summary',
      driverId,
      date,
    );
  }

  @Get('health')
  healthCheck() {
    return {
      status: 'Tasks service is running',
      timestamp: new Date().toISOString(),
    };
  }
}
