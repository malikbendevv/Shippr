import { ApiProperty } from '@nestjs/swagger';

export class AddressResponseDto {
  @ApiProperty({ example: 'uuid-123', description: 'Auto-generated UUID' })
  id!: string;

  @ApiProperty({
    example: '123 Main St',
    description: 'Street address',
    required: false,
  })
  street?: string;

  @ApiProperty({
    example: 'Apt 4B',
    description: 'Additional address information',
    required: false,
  })
  street2?: string;

  @ApiProperty({ example: 'New York', description: 'City name' })
  city!: string;

  @ApiProperty({ example: 'NY', description: 'State name' })
  state!: string;

  @ApiProperty({
    example: '10001',
    description: 'Postal code',
    required: false,
  })
  zipCode?: string;

  @ApiProperty({
    example: 'Algeria',
    description: 'Country name',
    default: 'Algeria',
  })
  country!: string;

  @ApiProperty({
    example: 36.7538,
    description: 'Latitude coordinate',
    required: false,
  })
  latitude?: number;

  @ApiProperty({
    example: 3.0588,
    description: 'Longitude coordinate',
    required: false,
  })
  longitude?: number;
}
