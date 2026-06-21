import { IsNotEmpty, IsString, Length, max } from 'class-validator';

export class JoinOrgDto {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsString()
  @IsNotEmpty()
  @Length(8, 8, { message: 'Invite code invalid, should be 8 digit long' })
  inviteCode!: string;
}
