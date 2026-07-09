import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ResendVerificationDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'The primary registration email of the user',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}
