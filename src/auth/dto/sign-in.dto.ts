import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class SignInDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'The primary registration email of the user',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'SecurePassword123!',
    description: 'The account password',
  })
  @IsString()
  @MinLength(8)
  password!: string;
}
