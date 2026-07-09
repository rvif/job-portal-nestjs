import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LogoutDto {
  @ApiProperty({
    description:
      'Token used to regenerate an access token incase of expiration.',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}
