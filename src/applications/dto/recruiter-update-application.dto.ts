import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApplicationStatus } from '../entities/application.entity';
import { ApiProperty } from '@nestjs/swagger';

export class RecruiterUpdateApplicationDto {
  @ApiProperty({
    example: 'applied',
    description:
      "Valid options are {'applied','reviewing','shortlisted','rejected','hired'}",
  })
  @IsEnum(ApplicationStatus)
  @IsNotEmpty()
  status!: ApplicationStatus;
}
