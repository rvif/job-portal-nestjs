import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    description:
      'Token used to regenerate an access token incase of expiration.',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}
