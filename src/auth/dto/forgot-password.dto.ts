import { OmitType } from '@nestjs/mapped-types';
import { VerifyEmailDto } from './verify-email.dto';

export class ForgotPasswordDto extends OmitType(VerifyEmailDto, [
  'otp',
] as const) {}
