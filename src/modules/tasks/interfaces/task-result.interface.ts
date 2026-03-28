import { TaskStatus } from '../enums/task-status.enum';

export interface TaskResult {
  taskId: string;
  taskName: string;
  status: TaskStatus;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in milliseconds
  result?: any;
  error?: string;
  metadata?: Record<string, any>;
}

