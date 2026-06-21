import { PartialType } from '@nestjs/mapped-types';
import { CreateOrgDto } from './create-organization.dto';

export class UpdateOrgDto extends PartialType(CreateOrgDto) {}
