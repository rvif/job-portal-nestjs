import { PartialType } from '@nestjs/mapped-types';
import { CreateApplicationDto } from './create-application.dto';

export class CandidateUpdateApplicationDto extends PartialType(
  CreateApplicationDto,
) {}
