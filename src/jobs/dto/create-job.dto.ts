import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { EmploymentType, ExperienceLevel } from '../entities/job.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateJobDto {
  @ApiProperty({
    example: 'Content Writer',
    description: 'Title of the job posting',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  title!: string;

  @ApiProperty({
    description: 'Description of the job posting',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  description!: string;

  @ApiPropertyOptional({
    description: 'Location of the job posting',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  location?: string;

  @ApiProperty({
    example: 'true',
    description: 'Is the job remote or not. Valid options are {true, false}',
  })
  @IsBoolean()
  @IsNotEmpty()
  isRemote!: boolean;

  @ApiProperty({
    example: 'full_time',
    description:
      "Valid options are {'full_time', 'part_time', internship', 'contract'}",
  })
  @IsEnum(EmploymentType)
  @IsNotEmpty()
  employmentType!: EmploymentType;

  @ApiProperty({
    example: 'fresher',
    description: "Valid options are {'fresher', 'mid', 'senior'}",
  })
  @IsEnum(ExperienceLevel)
  @IsNotEmpty()
  experienceLevel!: ExperienceLevel;

  @ApiProperty({
    description: 'Minimum range for the salary',
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0, { message: 'this field cannot be negative' })
  salaryMin!: number;

  @ApiProperty({
    description: 'Minimum range for the salary',
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0, { message: 'this field cannot be negative' })
  salaryMax!: number;
}
