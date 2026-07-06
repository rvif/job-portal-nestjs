import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JobsController, OrganizationJobController } from './jobs.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Job } from './entities/job.entity';
import { OrganizationModule } from 'src/organization/organization.module';
import { Organization } from 'src/organization/entities/organization.entity';
import { OrganizationMember } from 'src/organization/entities/organization-members.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Job, Organization, OrganizationMember]),
    OrganizationModule,
  ],
  providers: [JobsService],
  controllers: [JobsController, OrganizationJobController],
  exports: [JobsService, TypeOrmModule],
})
export class JobsModule {}
