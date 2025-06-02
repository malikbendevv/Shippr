// src/users/dto/user.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { AddressResponseDto } from './address-response.dto';

export class UserDto {
  @ApiProperty({ example: 'a1b2c3d4', description: 'Auto-generated UUID' })
  id: string;

  @ApiProperty({ example: 'user@example.com', description: 'Must be unique' })
  email: string;

  @ApiProperty({ example: 'John', required: false })
  firstName?: string;

  @ApiProperty({ example: 'Doe', required: false })
  lastName?: string;

  @ApiProperty({
    example: '+213123456789',
    description: 'Algerian format: +213XXXXXXXXX',
    required: false,
  })
  phoneNumber?: string;

  @ApiProperty({
    example: 'customer',
    enum: ['customer', 'driver', 'admin'],
    default: 'customer',
  })
  role: string;

  @ApiProperty({
    type: [AddressResponseDto],
    description: 'User addresses',
    required: false,
  })
  addresses?: AddressResponseDto[];

  @ApiProperty({
    example: '2024-03-15T12:00:00Z',
    description: 'User creation timestamp',
    required: false,
  })
  createdAt?: Date;

  @ApiProperty({
    example: '2024-03-15T12:00:00Z',
    description: 'Last update timestamp',
    required: false,
  })
  updatedAt?: Date;
}
