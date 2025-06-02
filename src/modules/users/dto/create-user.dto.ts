// src/users/dto/create-user.dto.ts
import {
  IsEmail,
  IsString,
  IsNotEmpty,
  IsOptional,
  MinLength,
  Matches,
  NotContains,
  MaxLength,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { AddressDto } from './address.dto';

export class CreateUserDto {
  @ApiProperty({
    example: 'example@gmail.com',
    description: 'email of the user',
  })
  @IsEmail()
  @IsNotEmpty({ message: 'Email must not be empty' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @Matches(/[A-Z]/, {
    message: 'Password must contain at least 1 uppercase letter',
  })
  @Matches(/[a-z]/, {
    message: 'Password must contain at least 1 lowercase letter',
  })
  @Matches(/[0-9]/, {
    message: 'Password must contain at least 1 number',
  })
  @Matches(/[!@#$%^&*(),.?":{}|<>]/, {
    message: 'Password must contain at least 1 special character',
  })
  @NotContains(' ', {
    message: 'Password must not contain spaces',
  })
  @ApiProperty({ example: 'strongPassword123/', description: 'User password' })
  password: string;

  @IsString({ message: 'First name must be text' })
  @IsNotEmpty({ message: 'First name is required' })
  @MaxLength(50, {
    message: 'First name cannot exceed 50 characters',
  })
  @ApiProperty({ example: 'Malik', description: 'First name of the user' })
  firstName: string;

  @IsString({ message: 'Last name must be text' })
  @IsNotEmpty({ message: 'Last name is required' })
  @ApiProperty({ example: 'Ben', description: 'Last name of the user' })
  lastName: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[\d\s\-()]{8,}$/, {
    message: 'Enter a valid phone number (e.g., +1234567890 or 123-456-7890)',
  })
  @ApiProperty({ example: '+213659000000', description: 'Phone number' })
  phoneNumber: string;

  @ApiProperty({
    type: [AddressDto],
    description: 'User addresses',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddressDto)
  addresses?: AddressDto[];
}
