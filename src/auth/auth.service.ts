import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { User } from 'src/users/users.entity';
import { JwtService } from '@nestjs/jwt';
import { SignUpDto } from './dto/sign-up.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { RefreshToken } from './entities/refresh-token.entity';
import { IsNull, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Otp, OtpType } from './entities/email-verification-otp.entity';
import { MailService } from 'src/mail/mail.service';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { LogoutDto } from './dto/logout.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,

    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,

    @InjectRepository(Otp)
    private readonly otpRepo: Repository<Otp>,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findOneByEmail(email);
    // console.log(user);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.hashedPassword) {
      return null;
    }

    const passwordMatch = await bcrypt.compare(password, user.hashedPassword);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException(
        'Verification pending, Please verify your email',
      );
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  }

  async signup(signUpDto: SignUpDto) {
    // console.log(signUpDto);
    const { email, password, ...userData } = signUpDto;
    const emailInUse = await this.usersService.findOneByEmail(email);
    if (emailInUse) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const createUserInput = {
      ...userData,
      email,
      hashedPassword,
    };

    const createdUserEntry = await this.usersService.create(createUserInput);

    const { otp } = await this.createOtpEntry(
      createdUserEntry.id,
      OtpType.EMAIL_VERIFICATION,
    );
    await this.sendVerificationMail(createdUserEntry.email, otp);
    return {
      message:
        'Account created successfully. Otp sent to your email address for verification. Please verify.',
    };
  }

  async login(user: Omit<User, 'hashedPassword'>) {
    return this.generateAuthTokens(user);
  }

  private async generateAuthTokens(user: Omit<User, 'hashedPassword'>) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    const secret = uuidv4();

    const tokenId = await this.storeRefreshToken(secret, user.id);

    const refreshToken = `${tokenId}.${secret}`;

    return {
      access_token: accessToken,
      refresh_token: refreshToken, // send plain text to client
    };
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    const { refreshToken } = refreshTokenDto;
    const [tokenId, secret] = refreshToken.split('.');

    if (!tokenId || !secret) {
      throw new UnauthorizedException('Invalid refresh token format');
    }
    const refreshTokenEntry = await this.refreshTokenRepo.findOne({
      where: {
        id: tokenId,
      },
      relations: {
        // load user fields
        user: true,
      },
    });

    if (!refreshTokenEntry) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const isRefreshTokenMatching = await bcrypt.compare(
      secret,
      refreshTokenEntry.hashedToken,
    );
    if (!isRefreshTokenMatching) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const currentTime = new Date(); // default is current timestamp, no need to add Date.now() as parameter
    if (currentTime > refreshTokenEntry.expiresAt) {
      throw new UnauthorizedException(
        'Refresh token has expired, Please login again',
      );
    }

    if (refreshTokenEntry.revokedAt) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    // Token rotation
    refreshTokenEntry.revokedAt = new Date();
    this.refreshTokenRepo.save(refreshTokenEntry);

    return this.generateAuthTokens(refreshTokenEntry.user);
  }

  private async storeRefreshToken(secret: string, userId: string) {
    const REFRESH_TOKEN_EXPIRY_DAYS = 7;
    const expiresAt = new Date(
      Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000, // multiply by 1000 to convert the entire thing in milliseconds
    );

    const hashedRefreshToken = await bcrypt.hash(secret, 10);
    const refreshTokenEntry = this.refreshTokenRepo.create({
      user: {
        id: userId,
      },
      hashedToken: hashedRefreshToken,
      expiresAt: expiresAt,
    });

    await this.refreshTokenRepo.save(refreshTokenEntry);

    return refreshTokenEntry.id;
  }

  private async createOtpEntry(userId: string, otpType: OtpType) {
    // invalidate all other otps for this user
    this.otpRepo.update(
      {
        user: { id: userId },
        type: OtpType.EMAIL_VERIFICATION,
        usedAt: IsNull(),
      },
      {
        usedAt: new Date(),
      },
    );

    // actual logic begins here
    const otp = this.generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);
    const otpEntry = this.otpRepo.create({
      user: {
        id: userId,
      },
      otpHash: hashedOtp,
      type: otpType,
      expiresAt,
    });

    await this.otpRepo.save(otpEntry);
    // return plain text otp
    return {
      otp,
    };
  }

  private async sendVerificationMail(email: string, otp: string) {
    await this.mailService.sendEmail(
      email,
      'Verify your email',
      `Hello, from Team Rozgaar\nYour otp: ${otp}`,
    );
  }

  private async sendPasswordResetMail(email: string, otp: string) {
    await this.mailService.sendEmail(
      email,
      'Reset your password',
      `Hello, from Team Rozgaar\nYour otp: ${otp}`,
    );
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto) {
    const { email, otp } = verifyEmailDto;
    const userEntry = await this.usersService.findOneByEmail(email);
    if (!userEntry) {
      throw new NotFoundException("User doesn't exist");
    }

    if (userEntry.emailVerified) {
      throw new ConflictException('User email already verified');
    }

    const otpEntry = await this.otpRepo.findOne({
      where: {
        user: { id: userEntry.id },
        type: OtpType.EMAIL_VERIFICATION,
        usedAt: IsNull(),
      },
      order: {
        createdAt: 'DESC',
      },
    });

    if (!otpEntry) {
      throw new UnauthorizedException("Otp doesn't exist");
    }

    if (otpEntry.expiresAt < new Date()) {
      throw new UnauthorizedException('Otp has expired');
    }

    const isOtpMatching = await bcrypt.compare(otp, otpEntry.otpHash);
    if (!isOtpMatching) {
      throw new UnauthorizedException('Wrong otp');
    }

    // otp is correct
    otpEntry.usedAt = new Date();
    await this.otpRepo.save(otpEntry);

    await this.usersService.update(userEntry.id, { emailVerified: true });
    return {
      message: 'Email verified successfully',
    };
  }

  async resendVerification(
    sendVerificationMailDto: Omit<VerifyEmailDto, 'otp'>,
  ) {
    const { email } = sendVerificationMailDto;
    const userEntry = await this.usersService.findOneByEmail(email);
    if (!userEntry) {
      throw new NotFoundException("User with email doesn't exist");
    }

    if (userEntry.emailVerified) {
      throw new ConflictException('Email already verified');
    }
    const { otp } = await this.createOtpEntry(
      userEntry.id,
      OtpType.EMAIL_VERIFICATION,
    );
    await this.sendVerificationMail(email, otp);

    return {
      message: 'Verification email resent!',
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;
    const userEntry = await this.usersService.findOneByEmail(email);
    if (userEntry) {
      const { otp } = await this.createOtpEntry(
        userEntry.id,
        OtpType.PASSWORD_RESET,
      );
      await this.sendPasswordResetMail(email, otp);
    }
    return {
      message: 'If an account exists, a reset code has been sent',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { email, otp, newPassword } = resetPasswordDto;
    const userEntry = await this.usersService.findOneByEmail(email);
    if (!userEntry) {
      throw new UnauthorizedException("User with email doesn't exist");
    }

    const otpEntry = await this.otpRepo.findOne({
      where: {
        user: { id: userEntry.id },
        type: OtpType.PASSWORD_RESET,
        usedAt: IsNull(),
      },

      order: {
        createdAt: 'DESC',
      },
    });

    if (!otpEntry) {
      throw new UnauthorizedException("Otp doesn't exist");
    }

    if (otpEntry.expiresAt < new Date()) {
      throw new UnauthorizedException('Otp has expired');
    }

    const isOtpMatching = await bcrypt.compare(otp, otpEntry.otpHash);
    if (!isOtpMatching) {
      throw new UnauthorizedException('Wrong OTP');
    }

    // otp is correct, mark it as used
    otpEntry.usedAt = new Date();
    await this.otpRepo.save(otpEntry);

    // hash new password and store
    const newHashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersService.update(userEntry.id, {
      hashedPassword: newHashedPassword,
    });

    // revoke refresh tokens for this user
    await this.revokeAllRefreshTokens(userEntry.id);
    return {
      message: 'Your password was reset successfully.',
    };
  }

  private async revokeAllRefreshTokens(userId: string) {
    await this.refreshTokenRepo.update(
      {
        user: {
          id: userId,
        },
        revokedAt: IsNull(),
      },
      {
        revokedAt: new Date(),
      },
    );
  }

  async changePassword(changePasswordDto, email) {
    const { oldPassword, newPassword } = changePasswordDto;
    const userEntry = await this.usersService.findOneByEmail(email);
    if (!userEntry) {
      throw new UnauthorizedException('User not found');
    }
    if (!userEntry.hashedPassword) {
      throw new BadRequestException(
        'Password changes are unavailable for OAuth accounts',
      );
    }

    const currentPassword = userEntry.hashedPassword;
    const passwordMatching = await bcrypt.compare(oldPassword, currentPassword);
    if (!passwordMatching) {
      throw new UnauthorizedException('Password is incorrect');
    }

    if (oldPassword == newPassword) {
      throw new ConflictException(
        "Can't use the same password as new password",
      );
    }

    const newHashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersService.update(userEntry.id, {
      hashedPassword: newHashedPassword,
    });

    await this.revokeAllRefreshTokens(userEntry.id);

    return {
      message: 'Password changed successfully, Please login again',
    };
  }

  async logout(logoutDto: LogoutDto) {
    const { refreshToken } = logoutDto;
    const [tokenId, secret] = refreshToken.split('.');

    if (!tokenId || !secret) {
      throw new UnauthorizedException('Invalid refresh token format');
    }
    const refreshTokenEntry = await this.refreshTokenRepo.findOne({
      where: {
        id: tokenId,
      },
    });

    if (!refreshTokenEntry) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (refreshTokenEntry.revokedAt) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    const isRefreshTokenMatching = await bcrypt.compare(
      secret,
      refreshTokenEntry.hashedToken,
    );

    if (!isRefreshTokenMatching) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (refreshTokenEntry.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    refreshTokenEntry.revokedAt = new Date();
    await this.refreshTokenRepo.save(refreshTokenEntry);

    return {
      message: 'You have been logged out.',
    };
  }

  async logoutAllSessionAndDevices(userId: string) {
    await this.revokeAllRefreshTokens(userId);
    return {
      message: 'Logged out from all devices and sessions.',
    };
  }
}
