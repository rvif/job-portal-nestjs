import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
} from 'class-validator';
import { EmploymentType, ExperienceLevel } from '../entities/job.entity';

export class CreateJobDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  description!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  location!: string;

  @IsBoolean()
  @IsNotEmpty()
  isRemote!: boolean;

  @IsEnum(EmploymentType)
  @IsNotEmpty()
  employmentType!: EmploymentType;

  @IsEnum(ExperienceLevel)
  @IsNotEmpty()
  experienceLevel!: ExperienceLevel;

  @IsNumber()
  @IsNotEmpty()
  salaryMin!: number;

  @IsNumber()
  @IsNotEmpty()
  salaryMax!: number;
}
