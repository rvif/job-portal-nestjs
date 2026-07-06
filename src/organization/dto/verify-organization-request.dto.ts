import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyOrganizationRequestDto {
  @IsString()
  @IsNotEmpty()
  domain!: string;
}
