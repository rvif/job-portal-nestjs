import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  // required only for users who already have a password.
  // set empty to set new password (first time) for oauth user
  @ApiProperty({
    example: 'SecurePassword123',
    description: 'Secure old password, atleast 8 digit long.',
  })
  @IsString()
  @MinLength(8)
  @IsOptional()
  oldPassword?: string;

  @ApiProperty({
    example: 'SecurePassword456',
    description: 'Secure new password, atleast 8 digit long.',
  })
  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  newPassword!: string;
}
