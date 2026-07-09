import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, Length } from 'class-validator';

export class JoinOrgDto {
  @ApiProperty({
    description: 'Id (uuid) of organization to join.',
  })
  @IsUUID()
  @IsNotEmpty()
  orgId!: string;

  @ApiProperty({
    example: '12345678',
    description: 'Valid invite code to join the organization.',
  })
  @IsString()
  @IsNotEmpty()
  @Length(8, 8, { message: 'Invite code invalid, should be 8 digit long' })
  inviteCode!: string;
}
