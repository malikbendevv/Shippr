import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
  NotContains,
} from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ description: 'Reset token received by email' })
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({ example: 'StrongPass1!', description: 'New password' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @Matches(/[A-Z]/, { message: 'Password must contain at least 1 uppercase letter' })
  @Matches(/[a-z]/, { message: 'Password must contain at least 1 lowercase letter' })
  @Matches(/[0-9]/, { message: 'Password must contain at least 1 number' })
  @Matches(/[!@#$%^&*(),.?":{}|<>]/, {
    message: 'Password must contain at least 1 special character',
  })
  @NotContains(' ', { message: 'Password must not contain spaces' })
  newPassword!: string;
}
