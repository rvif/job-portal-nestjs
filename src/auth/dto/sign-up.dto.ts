import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserRole } from 'src/users/users.entity';

export class SignUpDto {
  @ApiProperty({
    example: 'John',
    description: 'Your first name',
  })
  @IsString()
  @MaxLength(50)
  @IsNotEmpty()
  firstName!: string;

  @ApiProperty({
    example: 'Doe',
    description: 'Your last name',
  })
  @IsString()
  @MaxLength(50)
  @IsNotEmpty()
  lastName!: string;

  @ApiProperty({
    example: 'example@gmail.com',
    description: 'Your email address',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    example: 'SecurePassword123',
    description: 'Secure password, atleast 8 digit long.',
  })
  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password!: string;

  @ApiProperty({
    example: 'candidate',
    description:
      "One of the two user roles which are {'candidate', 'recruiter'} ",
  })
  @IsEnum(UserRole)
  role?: UserRole;
}
