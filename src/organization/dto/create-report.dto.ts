import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateReportDto {
  @ApiProperty({
    description: 'Valid reason for reporting the organization.',
  })
  @IsString()
  @IsNotEmpty()
  reason!: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the situation.',
  })
  @IsString()
  @IsOptional()
  description?: string;
}
