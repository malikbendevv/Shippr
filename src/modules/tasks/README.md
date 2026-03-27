# Tasks Module

This module handles scheduled tasks and automated processes in the NestJS backend.

## Features

### Driver Daily Order Summary

- **Schedule**: Runs daily at 8:00 AM
- **Purpose**: Sends email summaries to drivers about their orders from the previous day
- **Content**: Includes order details, statistics, and earnings information

## API Endpoints

### Manual Task Execution

```http
POST /tasks/execute
Content-Type: application/json

{
  "taskName": "driver-daily-summary",
  "args": ["driver-id", "2024-01-15"]
}
```

### Driver Summary for Specific Driver

```http
POST /tasks/driver-summary/:driverId
Content-Type: application/json

{
  "date": "2024-01-15" // Optional, defaults to yesterday
}
```

### Health Check

```http
GET /tasks/health
```

## Email Template

The driver daily summary email includes:

- **Summary Statistics**: Total orders, completed orders, total earnings, total distance
- **Order Details**: Each order with pickup/dropoff addresses, customer info, and status
- **Professional Design**: Responsive HTML template with modern styling

## Configuration

### Cron Schedule

The task runs automatically every day at 8:00 AM using the cron expression:

```
0 8 * * * *
```

### Retry Logic

- **Max Retries**: 3 attempts
- **Retry Delay**: 5 seconds between attempts
- **Error Handling**: Comprehensive logging and error reporting

## Dependencies

- `@nestjs/schedule` - For cron job scheduling
- `@nestjs-modules/mailer` - For email sending
- `PrismaService` - For database operations

## Usage Example

```typescript
// The task runs automatically, but you can also trigger it manually:
await tasksService.executeTask('driver-daily-summary', driverId, date);
```

## Monitoring

All task executions are logged with:

- Start and completion timestamps
- Success/failure status
- Error details (if applicable)
- Performance metrics
