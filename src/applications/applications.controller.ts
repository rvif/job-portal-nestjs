import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Role } from 'src/auth/decorators/role.decorator';
import { RoleGuard } from 'src/auth/guards/role.guard';
import { UserRole } from 'src/users/users.entity';
import { ApplicationsService } from './applications.service';
import { OrganizationRoleGuard } from 'src/organization/guards/organization-role.guard';
import { OrganizationRole } from 'src/organization/entities/organization-members.entity';
import { OrgRole } from 'src/organization/decorators/organization-role.decorator';
import { RecruiterUpdateApplicationDto } from './dto/recruiter-update-application.dto';

@Controller('/jobs/:jobId/apply')
export class ApplicationsController {
  constructor(private readonly applicationService: ApplicationsService) {}
  @Post()
  @UseGuards(RoleGuard)
  @Role(UserRole.CANDIDATE)
  createApplication(@Param('jobId', ParseUUIDPipe) jobId: string, @Req() req) {
    return this.applicationService.create(jobId, req.user.id);
  }
}

@Controller('/applications/me')
export class ProfileApplicationController {
  constructor(private readonly applicationService: ApplicationsService) {}

  @Get()
  @UseGuards(RoleGuard)
  @Role(UserRole.CANDIDATE)
  getAllMyApplications(@Req() req) {
    return this.applicationService.findAllApplicationsByUserId(req.user.id);
  }

  @Get(':appId')
  @UseGuards(RoleGuard)
  @Role(UserRole.CANDIDATE)
  getMyApplicationById(
    @Param('appId', ParseUUIDPipe) appId: string,
    @Req() req,
  ) {
    return this.applicationService.getMyApplicationById(appId, req.user.id);
  }

  // @Patch(':appId')
  // @UseGuards(RoleGuard)
  // @Role(UserRole.CANDIDATE)
  // updateMyApplicationById(
  //   @Param('appId', ParseUUIDPipe) appId: string,
  //   @Req() req,
  // ) {
  //   return this.applicationService.updateMyApplicationById(appId, req.user.id);
  // }

  @Delete(':appId')
  @UseGuards(RoleGuard)
  @Role(UserRole.CANDIDATE)
  deleteMyApplicationById(
    @Param('appId', ParseUUIDPipe) appId: string,
    @Req() req,
  ) {
    return this.applicationService.deleteApplication(appId, req.user.id);
  }
}

@Controller('/organization/:orgId/jobs/:jobId/applications')
export class OrganizationApplicationsController {
  constructor(private readonly applicationService: ApplicationsService) {}
  @Get()
  @UseGuards(OrganizationRoleGuard)
  @OrgRole(OrganizationRole.ADMIN, OrganizationRole.MEMBER)
  getApplicantsByJobId(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Req() req,
  ) {
    return this.applicationService.findApplicationsByOrgIdAndJobId(
      orgId,
      jobId,
      req.user.id,
    );
  }

  @Patch(':appId')
  @UseGuards(OrganizationRoleGuard)
  @OrgRole(OrganizationRole.ADMIN, OrganizationRole.MEMBER)
  updateApplicationStatus(
    @Param('appId', ParseUUIDPipe) appId: string,
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('jobId', ParseUUIDPipe) jobId: string,

    @Req() req,
    @Body() updateApplicationDto: RecruiterUpdateApplicationDto,
  ) {
    return this.applicationService.updateApplicationStatus(
      appId,
      orgId,
      jobId,
      req.user.id,
      updateApplicationDto,
    );
  }
}
