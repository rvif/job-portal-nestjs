import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';
import { Public } from './decorators/public.decorator';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { Role } from './decorators/role.decorator';
import { UserRole } from 'src/users/users.entity';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/reverification.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LogoutDto } from './dto/logout.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async signin(@Body() _: SignInDto, @Req() req) {
    return this.authService.login(req.user);
  }

  @Public()
  @Post('signup')
  async signup(@Body() signUpDto: SignUpDto) {
    return this.authService.signup(signUpDto);
  }

  // @UseGuards(JwtAuthGuard) // global jwt guard enabled
  // @Role(UserRole.RECRUITER)
  @Get('profile')
  async getProfile(@Req() req) {
    return this.usersService.findOne(req.user.id);
  }

  @Post('refresh')
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK) // changes default 201 created to 200 ok
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.authService.verifyEmail(verifyEmailDto);
  }

  @Public()
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerification(
    @Body() resendVerificationDto: ResendVerificationDto,
  ) {
    return this.authService.resendVerification(resendVerificationDto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }
  @HttpCode(HttpStatus.OK)
  @Post('change-password')
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @Req() req,
  ) {
    return this.authService.changePassword(changePasswordDto, req.user.email);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body() logoutDto: LogoutDto) {
    return this.authService.logout(logoutDto);
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  async logoutAllSessionAndDevices(@Req() req) {
    return this.authService.logoutAllSessionAndDevices(req.user.id);
  }
}
