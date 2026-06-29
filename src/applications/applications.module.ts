import { Module } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import {
  ApplicationsController,
  OrganizationApplicationsController,
  ProfileApplicationController,
} from './applications.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Application } from './entities/application.entity';
import { JobsModule } from 'src/jobs/jobs.module';
import { OrganizationModule } from 'src/organization/organization.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Application]),
    JobsModule,
    OrganizationModule,
  ],
  providers: [ApplicationsService],
  controllers: [
    ApplicationsController,
    ProfileApplicationController,
    OrganizationApplicationsController,
  ],
})
export class ApplicationsModule {}
