import { CronExpression } from '@nestjs/schedule';

export const TASK_SCHEDULES = {
  // Daily tasks
  DAILY_DRIVER_SUMMARY: CronExpression.EVERY_DAY_AT_8AM,
  DAILY_REPORTS: CronExpression.EVERY_DAY_AT_9AM,
  DAILY_CLEANUP: CronExpression.EVERY_DAY_AT_2AM,

  // Weekly tasks
  WEEKLY_REPORTS: '0 9 * * 1', // Every Monday at 9 AM

  // Hourly tasks
  HOURLY_HEALTH_CHECK: CronExpression.EVERY_HOUR,

  // Custom schedules
  EVERY_15_MINUTES: '0 */15 * * * *',
  EVERY_30_MINUTES: '0 */30 * * * *',
} as const;

export const TASK_NAMES = {
  DRIVER_DAILY_SUMMARY: 'driver-daily-summary',
  GENERATE_REPORTS: 'generate-reports',
  CLEANUP_EXPIRED_DATA: 'cleanup-expired-data',
  HEALTH_CHECK: 'health-check',
} as const;

