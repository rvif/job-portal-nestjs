import { IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { VerificationStatus } from '../entities/organization-verification-requests.entity';

export class VerifyOrganizationDto {
  @IsUUID()
  @IsNotEmpty()
  reqId!: string;

  @IsEnum(VerificationStatus)
  @IsNotEmpty()
  status!: VerificationStatus;
}
