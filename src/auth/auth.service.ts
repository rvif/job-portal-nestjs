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
import { SignUpDto } from './dto/sign-up.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { RefreshToken } from './entities/refresh-token.entity';
import { IsNull, Repository } from 'typeorm';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Otp, OtpType } from './entities/email-verification-otp.entity';
import { MailService } from 'src/mail/mail.service';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { LogoutDto } from './dto/logout.dto';
import { OauthUser } from 'src/users/user.types';
import { CommonService } from 'src/common/common.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
    private readonly commonService: CommonService,

    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,

    @InjectRepository(Otp)
    private readonly otpRepo: Repository<Otp>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectQueue('email-queue')
    private readonly emailQueue: Queue,
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

  async oauthLogin(user: OauthUser) {
    const { email, firstName, lastName, photo, providerId } = user;

    let userEntry = await this.usersService.findOneByEmail(email);
    if (userEntry) {
      if (!userEntry.googleId) {
        // if user exists but they want to connect their google acc
        userEntry.googleId = providerId;
        await this.userRepo.save(userEntry);
      }
      return this.commonService.generateAuthTokens(userEntry);
    }

    const createUserInput = {
      email,
      firstName,
      lastName,
      avatarUrl: photo,
      googleId: providerId,
      emailVerified: true,
    };

    userEntry = await this.usersService.create(createUserInput);
    console.log(userEntry);
    return this.commonService.generateAuthTokens(userEntry);
  }

  async login(user: Omit<User, 'hashedPassword'>) {
    return this.commonService.generateAuthTokens(user);
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

    return this.commonService.generateAuthTokens(refreshTokenEntry.user);
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
    await this.emailQueue.add(
      'send-email',
      {
        to: email,
        subject: 'Verify your email',
        body: `Hello, from Team Rozgaar\nYour One Time Password (OTP): ${otp}\n Expires in 10 minutes from now.`,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    );
  }

  private async sendPasswordResetMail(email: string, otp: string) {
    await this.emailQueue.add(
      'send-email',
      {
        to: email,
        subject: 'Reset your password',
        body: `Hello, from Team Rozgaar\nYour One Time Password (OTP): ${otp}\n Expires in 10 minutes from now.}`,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
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
    if (!userEntry) {
      throw new UnauthorizedException("User with email doesn't exist");
    }

    if (!userEntry.hashedPassword) {
      // oauth user that hasn't linked their account
      throw new BadRequestException('This account uses Google sign-in');
    }

    const { otp } = await this.createOtpEntry(
      userEntry.id,
      OtpType.PASSWORD_RESET,
    );
    await this.sendPasswordResetMail(email, otp);

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

    if (!userEntry.hashedPassword) {
      // oauth user that hasn't linked their account
      throw new BadRequestException('This account uses Google sign-in');
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

  async changePassword(changePasswordDto: ChangePasswordDto, email: string) {
    const { oldPassword, newPassword } = changePasswordDto;

    const userEntry = await this.usersService.findOneByEmail(email);

    if (!userEntry) {
      throw new UnauthorizedException('User not found');
    }

    if (!userEntry.hashedPassword) {
      // set first ever password (link account) for the oauth user
      const newHashedPassword = await bcrypt.hash(newPassword, 10);
      await this.usersService.update(userEntry.id, {
        hashedPassword: newHashedPassword,
      });

      await this.revokeAllRefreshTokens(userEntry.id);

      return {
        message:
          'Password created successfully. You can now sign in using either Google or your email and password.',
      };
    }

    // verify old password logic, and change to new password
    if (!oldPassword) {
      throw new BadRequestException('Please provide your old password aswell.');
    }

    const currentPassword = userEntry.hashedPassword;
    const passwordMatching = await bcrypt.compare(oldPassword, currentPassword);
    if (!passwordMatching) {
      throw new UnauthorizedException('Password is incorrect');
    }

    const samePassword = await bcrypt.compare(newPassword, currentPassword);
    if (samePassword) {
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
