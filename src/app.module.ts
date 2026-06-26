import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { User } from './users/users.entity';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RoleGuard } from './auth/guards/role.guard';
import { RefreshToken } from './auth/entities/refresh-token.entity';
import { MailModule } from './mail/mail.module';
import { Otp } from './auth/entities/email-verification-otp.entity';
import { OrganizationModule } from './organization/organization.module';
import { Organization } from './organization/entities/organization.entity';
import { OrganizationMember } from './organization/entities/organization-members.entity';
import { JobsModule } from './jobs/jobs.module';
import { Job } from './jobs/entities/job.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UsersModule,
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.getOrThrow('DB_HOST'),
        port: Number(configService.getOrThrow('DB_PORT')),
        username: configService.getOrThrow('DB_USERNAME'),
        password: configService.getOrThrow('DB_PASSWORD'),
        database: configService.getOrThrow('DB_NAME'),
        entities: [
          User,
          RefreshToken,
          Otp,
          Organization,
          OrganizationMember,
          Job,
        ],
        synchronize: true, // set false for production, and do manual migrations
      }),
    }),
    AuthModule,
    MailModule,
    OrganizationModule,
    JobsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RoleGuard,
    },
  ],
})
export class AppModule {
  constructor(private datasource: DataSource) {
    this.datasource
      .query('SELECT 1')
      .then(() => console.log('db connected'))
      .catch((err) => console.log('error: ' + err));
  }
}
