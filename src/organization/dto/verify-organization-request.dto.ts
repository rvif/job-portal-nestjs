import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyOrganizationRequestDto {
  @ApiProperty({
    description: "Your organization's website for manual verification.",
  })
  @IsString()
  @IsNotEmpty()
  domain!: string;
}
