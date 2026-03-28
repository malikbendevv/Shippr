// src/users/dto/create-user.dto.ts
import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @IsNotEmpty({ message: 'Email must not be empty' })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: 'Password must not be empty' })
  password!: string;
}
