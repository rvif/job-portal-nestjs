import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  oldPassword!: string;

  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  newPassword!: string;
}
