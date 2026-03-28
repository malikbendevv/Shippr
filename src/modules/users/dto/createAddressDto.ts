import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateAddressDto {
  @ApiProperty({
    example: '123 Main St',
    description: 'Street address',
    required: false,
  })
  @IsOptional()
  @IsString()
  street!: string;

  @ApiProperty({
    example: 'Apt 4B',
    description: 'Additional address information',
    required: false,
  })
  @IsString()
  @IsOptional()
  street2?: string;

  @ApiProperty({
    example: 'New York',
    description: 'City name',
    required: false,
  })
  @IsOptional()
  @IsString()
  city!: string;

  @ApiProperty({
    example: 'NY',
    description: 'State name',
    required: false,
  })
  @IsOptional()
  @IsString()
  state!: string;

  @ApiProperty({
    example: '10001',
    description: 'Postal code',
    required: false,
  })
  @IsString()
  @IsOptional()
  zipCode!: string;

  @ApiProperty({
    example: 'Algeria',
    description: 'Country name',
    required: false,
  })
  @IsOptional()
  @IsString()
  country!: string;

  @ApiProperty({
    example: 36.7538,
    description: 'Latitude coordinate',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  latitude!: number;

  @ApiProperty({
    example: 3.0588,
    description: 'Longitude coordinate',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  longitude!: number;
}
