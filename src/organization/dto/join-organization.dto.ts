import { IsNotEmpty, IsString, IsUUID, Length } from 'class-validator';

export class JoinOrgDto {
  @IsUUID()
  @IsNotEmpty()
  orgId!: string;

  @IsString()
  @IsNotEmpty()
  @Length(8, 8, { message: 'Invite code invalid, should be 8 digit long' })
  inviteCode!: string;
}
