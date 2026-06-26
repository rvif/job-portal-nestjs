import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { EmploymentType, ExperienceLevel } from '../entities/job.entity';
import { Transform, Type } from 'class-transformer';

export class QueryJobDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsEnum(EmploymentType)
  employmentType?: EmploymentType;

  @IsOptional()
  @IsEnum(ExperienceLevel)
  experienceLevel?: ExperienceLevel;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isRemote?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  salaryMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  salaryMax?: number;
}
