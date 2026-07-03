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
import { ApplicationsModule } from './applications/applications.module';
import { Application } from './applications/entities/application.entity';
import { ThrottlerModule } from '@nestjs/throttler';
import { CloudinaryModule } from './cloudinary/cloudinary.module';

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
          Application,
        ],
        synchronize: true, // set false for production, and do manual migrations
      }),
    }),
    AuthModule,
    MailModule,
    OrganizationModule,
    JobsModule,
    ApplicationsModule,
    ThrottlerModule.forRoot({
      throttlers: [
        {
          // 1 sec
          name: 'short',
          ttl: 1000,
          limit: 3,
        },
        {
          // 10 secs
          name: 'medium',
          ttl: 10000,
          limit: 20,
        },
        {
          // 60 secs
          name: 'short',
          ttl: 60000,
          limit: 100,
        },
      ],
    }),
    CloudinaryModule,
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
    {
      provide: APP_GUARD,
      useClass: ThrottlerModule,
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
