import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { EmploymentType, ExperienceLevel, Job } from '../entities/job.entity';
import { Transform, Type } from 'class-transformer';

export enum JobSortField {
  CREATED_AT = 'createdAt',
  SALARY_MAX = 'salaryMax',
  SALARY_MIN = 'salaryMin',
  TITLE = 'title',
  LOCATION = 'location',
}

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}
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

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit: number = 10;

  @IsOptional()
  @IsEnum(JobSortField)
  sortBy: JobSortField = JobSortField.CREATED_AT;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder: SortOrder = SortOrder.DESC;

  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
