// src/users/dto/user.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class OrderDto {
  @ApiProperty({ example: 'a1b2c3d4', description: 'Auto-generated UUID' })
  id!: string;

  @ApiProperty({ example: 'Pizza', description: 'Name of the order' })
  name!: string;

  @ApiProperty({ example: 'Pizza 4 season', required: false })
  description?: string;

  @ApiProperty({ example: 'Doe', required: false })
  driverId?: string;

  @ApiProperty({ example: 'Doe' })
  customerId?: string;

  @ApiProperty({ example: 'Doe' })
  pickupAddressId?: string;

  @ApiProperty({ example: 'Doe' })
  dropoffAddressId?: string;

  @ApiProperty({
    example: 'PENDING',
    enum: [
      'PENDING',
      'ASSIGNED',
      'PICKED_UP',
      'IN_TRANSIT',
      'DELIVERED',
      'CANCELLED',
      'RETURNED',
    ],
    default: 'PENDING',
  })
  status!: string;

  @ApiProperty({
    example: '500',
    description: 'Estimated Distance between pickup address and dropOffAddress',
    required: false,
  })
  estimatedDistance?: number;

  @ApiProperty({
    example: '2',
    description: 'Estimated Duration between pickup address and dropOffAddress',
    required: false,
  })
  estimatedDuration?: number;
}
