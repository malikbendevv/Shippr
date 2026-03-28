import { IsString, IsOptional, IsArray, IsDateString } from 'class-validator';

export class ExecuteTaskDto {
  @IsString()
  taskName!: string;

  @IsOptional()
  @IsArray()
  args?: unknown[];

  @IsOptional()
  @IsDateString()
  scheduledFor?: string;
}

export class TaskExecutionResponseDto {
  taskId!: string;
  taskName!: string;
  status!: string;
  message!: string;
  timestamp!: string;
}
