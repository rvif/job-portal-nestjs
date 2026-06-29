import { IsEnum } from 'class-validator';
import { ApplicationStatus } from '../entities/application.entity';

export class RecruiterUpdateApplicationDto {
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;
}
