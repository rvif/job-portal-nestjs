import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'The primary registration email of the user',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    example: '12345678',
    description: '8 digit OTP sent via email',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(8)
  otp!: string;

  @ApiProperty({
    example: 'SecurePassword123',
    description: 'Secure new password, atleast 8 digit long.',
  })
  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  newPassword!: string;
}
