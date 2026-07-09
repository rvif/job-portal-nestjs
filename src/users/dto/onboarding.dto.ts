import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { UserRole } from '../users.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OnboardingDto {
  @ApiProperty({
    example: 'candidate',
    description:
      "One of the two user roles which are {'candidate', 'recruiter'} ",
  })
  @IsEnum(UserRole)
  @IsNotEmpty()
  role!: UserRole;

  @ApiProperty({
    example: 'johndoe100',
    description: 'An unique username used to identify you.',
  })
  @IsString()
  @MaxLength(24)
  @IsNotEmpty()
  username!: string;

  @ApiPropertyOptional({
    example: '+918292199290',
    description:
      'Your phone number, with appropriate country code appended in front.',
  })
  @IsString()
  @MaxLength(20)
  @IsOptional()
  phoneNumber?: string;

  @ApiPropertyOptional({
    example: 'Mumbai',
    description: 'Name of city you currently preside in',
  })
  @IsString()
  @IsOptional()
  location?: string;
}
