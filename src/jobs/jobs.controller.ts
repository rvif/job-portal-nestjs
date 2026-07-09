import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { OrganizationRoleGuard } from 'src/organization/guards/organization-role.guard';
import { OrgRole } from 'src/organization/decorators/organization-role.decorator';
import { OrganizationRole } from 'src/organization/entities/organization-members.entity';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { Public } from 'src/auth/decorators/public.decorator';
import { QueryJobDto } from './dto/query-job.dto';
import { OnboardingGuard } from 'src/common/guards/onboarding.guard';

@Controller('/jobs')
@UseGuards(OnboardingGuard)
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}
  @Public()
  @Get()
  getAllJobs(@Query() query: QueryJobDto) {
    return this.jobsService.getAllJobs(query);

    // TODO: advanced queries
    // 1. pagination (page, limit)
    // 2. sorting (createdAt desc, newest first)
    // 3. organization filtering
    // 4. full text search
  }

  @Public()
  @Get(':jobId')
  getJobById(@Param('jobId', ParseUUIDPipe) jobId: string) {
    return this.jobsService.getJobById(jobId);
  }
}

@Controller('/organization/:orgId/jobs')
@UseGuards(OnboardingGuard)
export class OrganizationJobController {
  constructor(private readonly jobsService: JobsService) {}

  @Public()
  @Get()
  getJobsByOrgId(@Param('orgId', ParseUUIDPipe) orgId: string) {
    return this.jobsService.getJobsByOrgId(orgId);
  }

  @Public()
  @Get(':jobId')
  getJobByOrgIdAndJobId(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('jobId', ParseUUIDPipe) jobId: string,
  ) {
    return this.jobsService.getJobByOrgIdAndJobId(orgId, jobId);
  }

  @Get('recruiter/:userId')
  @UseGuards(OrganizationRoleGuard)
  @OrgRole(OrganizationRole.ADMIN, OrganizationRole.MEMBER)
  getJobByRecruiter(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.jobsService.getJobsByRecruiter(orgId, userId);
  }

  @Post()
  @UseGuards(OrganizationRoleGuard)
  @OrgRole(OrganizationRole.ADMIN, OrganizationRole.MEMBER)
  createJob(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Body() createJobDto: CreateJobDto,
    @Req() req,
  ) {
    return this.jobsService.create(orgId, req.user.id, createJobDto);
  }

  @Patch(':jobId')
  @UseGuards(OrganizationRoleGuard)
  @OrgRole(OrganizationRole.ADMIN, OrganizationRole.MEMBER)
  updateJob(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Body() updateJobDto: UpdateJobDto,
  ) {
    return this.jobsService.update(orgId, jobId, updateJobDto);
  }

  @Delete(':jobId')
  @UseGuards(OrganizationRoleGuard)
  @OrgRole(OrganizationRole.ADMIN, OrganizationRole.MEMBER)
  deleteJob(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Req() req,
  ) {
    return this.jobsService.delete(orgId, jobId, req.user.id);
  }
}
