import { Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/users.entity';
import { OnboardingGuard } from './guards/onboarding.guard';
import { RefreshToken } from 'src/auth/entities/refresh-token.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, RefreshToken]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: '15M',
        },
      }),
    }),
  ],
  providers: [CommonService, OnboardingGuard],
  exports: [CommonService, OnboardingGuard, JwtModule, TypeOrmModule],
  // since onboarding-guard injects a repository, we need to export it separately
})
export class CommonModule {}
