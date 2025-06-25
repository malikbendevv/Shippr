import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
  NotContains,
} from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'user@gmail.com' })
  @IsString()
  @IsNotEmpty()
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
}
