import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Multer } from 'multer';

export class CreateOrgDto {
  @ApiProperty({
    description: 'Name of your organization.',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({
    description: 'Description for your organization.',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Physical address of your organization',
  })
  @IsString()
  @IsOptional()
  address?: string;

  // @ApiProperty({
  //   type: 'string',
  //   format: 'binary',
  //   description: 'Company logo image file (PNG, JPG)'
  // })
  // @IsOptional()
  // logo?: any;

  //  @ApiProperty({
  //   type: 'string',
  //   format: 'binary',
  //   description: 'Company banner image file (PNG, JPG)'
  // })
  // @IsOptional()
  // banner?: any;
}
