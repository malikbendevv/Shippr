import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreateAddressDto {
  @ApiProperty({
    example: '123 Main St',
    description: 'Street address',
  })
  @IsString()
  @IsNotEmpty()
  street: string;

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
  })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({
    example: 'NY',
    description: 'State name',
  })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({
    example: '10001',
    description: 'Postal code',
  })
  @IsString()
  @IsNotEmpty()
  zipCode: string;

  @ApiProperty({
    example: 'Algeria',
    description: 'Country name',
    default: 'Algeria',
  })
  @IsString()
  @IsNotEmpty()
  country: string;

  @ApiProperty({
    example: 36.7538,
    description: 'Latitude coordinate',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  latitude: number;

  @ApiProperty({
    example: 3.0588,
    description: 'Longitude coordinate',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  longitude: number;
}
