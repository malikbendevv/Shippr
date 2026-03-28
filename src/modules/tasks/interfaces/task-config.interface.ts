export interface TaskConfig {
  name: string;
  description?: string;
  cronExpression?: string;
  maxRetries?: number;
  retryDelay?: number; // in milliseconds
  timeout?: number; // in milliseconds
  enabled?: boolean;
  metadata?: Record<string, any>;
}

export interface ScheduledTaskConfig extends TaskConfig {
  cronExpression: string;
  timezone?: string;
}

