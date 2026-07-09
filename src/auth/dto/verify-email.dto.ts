import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class VerifyEmailDto {
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
}
