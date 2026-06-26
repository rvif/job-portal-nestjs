import { Module } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { OrganizationController } from './organization.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization } from './entities/organization.entity';
import { OrganizationMember } from './entities/organization-members.entity';
import { OrganizationRoleGuard } from './guards/organization-role.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Organization, OrganizationMember])],
  providers: [OrganizationService, OrganizationRoleGuard],
  controllers: [OrganizationController],
  exports: [OrganizationService, OrganizationRoleGuard],
})
export class OrganizationModule {}
