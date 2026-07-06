import { Module } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { OrganizationController } from './organization.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from './entities/organization.entity';
import { OrganizationMember } from './entities/organization-members.entity';
import { OrganizationRoleGuard } from './guards/organization-role.guard';
import { OrganizationVerificationRequest } from './entities/organization-verification-requests.entity';
import { OrganizationReport } from './entities/organization-reports.entity';
import { MailModule } from 'src/mail/mail.module';
import { Job } from 'src/jobs/entities/job.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Organization,
      OrganizationMember,
      OrganizationVerificationRequest,
      OrganizationReport,
      Job,
    ]),
    MailModule,
  ],
  providers: [OrganizationService, OrganizationRoleGuard],
  controllers: [OrganizationController],
  exports: [OrganizationService, OrganizationRoleGuard, TypeOrmModule],
  // usually guards dont need to be registered and exported to be used in other modules unless they inject dependencies in their constructors, thats why we export 'OrganizationRoleGuard'
})
export class OrganizationModule {}
