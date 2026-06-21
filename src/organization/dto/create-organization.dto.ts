import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateOrgDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  logoUrl?: string;

  @IsString()
  @IsOptional()
  bannerUrl?: string;
}
