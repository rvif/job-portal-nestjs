import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-yet';
import { ApplicationsModule } from 'src/applications/applications.module';
import { JobsModule } from 'src/jobs/jobs.module';
import { OrganizationModule } from 'src/organization/organization.module';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [
    OrganizationModule,
    JobsModule,
    ApplicationsModule,
    CommonModule,
    CacheModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        store: await redisStore({
          socket: {
            host: configService.getOrThrow<string>('REDIS_HOST'),
            port: parseInt(configService.getOrThrow<string>('REDIS_PORT'), 10),
          },
          password: configService.getOrThrow<string>('REDIS_PASSWORD'),
          ttl: 60 * 1000, // milliseconds, 1 min is default
        }),
      }),
    }),
  ],
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}
