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
  @IsString()
  @MaxLength(50)
  @IsNotEmpty()
  firstName!: string;

  @IsString()
  @MaxLength(50)
  @IsNotEmpty()
  lastName!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password!: string;

  @IsEnum(UserRole)
  role?: UserRole;
}
