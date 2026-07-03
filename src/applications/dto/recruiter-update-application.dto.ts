import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApplicationStatus } from '../entities/application.entity';

export class RecruiterUpdateApplicationDto {
  @IsEnum(ApplicationStatus)
  @IsNotEmpty()
  status!: ApplicationStatus;
}
