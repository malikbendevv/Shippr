import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

import { OrderStatus } from 'src/shared/types/order-status-enum';

export class CreateOrderDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsString()
  customerId?: string;

  @IsNotEmpty()
  @IsString()
  driverId?: string;

  @IsNotEmpty()
  @IsNumber()
  price: number;

  @IsNotEmpty()
  @IsString()
  pickupAddressId: string;

  @IsNotEmpty()
  @IsString()
  dropoffAddressId: string;

  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus = OrderStatus.PENDING;

  @IsNotEmpty()
  @IsNumber()
  estimatedDistance: number;

  @IsNotEmpty()
  @IsNumber()
  estimatedDuration: number;

  @IsNotEmpty()
  @IsNumber()
  expectedVersion?: number;

  @IsOptional()
  @IsBoolean()
  archived: boolean;
}
