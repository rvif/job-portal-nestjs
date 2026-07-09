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
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Application]),
    JobsModule,
    OrganizationModule,
    CloudinaryModule,
    CommonModule,
  ],
  providers: [ApplicationsService],
  controllers: [
    ApplicationsController,
    ProfileApplicationController,
    OrganizationApplicationsController,
  ],

  exports: [ApplicationsService, TypeOrmModule],
})
export class ApplicationsModule {}
