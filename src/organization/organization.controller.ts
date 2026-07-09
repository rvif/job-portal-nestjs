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
import { Role } from 'src/auth/decorators/role.decorator';
import { UserRole } from 'src/users/users.entity';
import { CreateOrgDto } from './dto/create-organization.dto';
import { OrganizationService } from './organization.service';
import { Public } from 'src/auth/decorators/public.decorator';
import { JoinOrgDto } from './dto/join-organization.dto';
import { UpdateOrgDto } from './dto/update-organization.dto';
import { OrgRole } from './decorators/organization-role.decorator';
import { OrganizationRole } from './entities/organization-members.entity';
import { OrganizationRoleGuard } from './guards/organization-role.guard';
import { VerifyOrganizationRequestDto } from './dto/verify-organization-request.dto';
import { DeveloperGuard } from 'src/common/guards/developer.guard';
import { VerifyOrganizationDto } from './dto/verify-organization.dto';
import { RoleGuard } from 'src/auth/guards/role.guard';
import { CreateReportDto } from './dto/create-report.dto';
import { QueryOrgJobDto } from './dto/query-org-job.dto';
import { OnboardingGuard } from 'src/common/guards/onboarding.guard';

@Controller('organization')
@UseGuards(OnboardingGuard)
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Post('create')
  @Role(UserRole.RECRUITER)
  async create(@Body() createOrgDto: CreateOrgDto, @Req() req) {
    return this.organizationService.create(createOrgDto, req.user.id);
  }

  @Get('my-organizations')
  async getOrg(@Req() req) {
    return this.organizationService.findAllOrgsByUserId(req.user.id); /// user can be in multiple orgs
  }

  @Public()
  @Get(':orgId')
  async findOne(@Param('orgId', ParseUUIDPipe) orgId: string) {
    return this.organizationService.findOneOrgPublic(orgId);
  }

  @Public()
  @Get(':orgId/jobs')
  async findAllJobsByOrg(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Query() query: QueryOrgJobDto,
  ) {
    return this.organizationService.findAllJobsByOrg(orgId, query);
  }

  @Post('join')
  async joinOrg(@Body() joinOrgDto: JoinOrgDto, @Req() req) {
    return this.organizationService.joinOrg(joinOrgDto, req.user.id);
  }

  @Patch(':orgId')
  @UseGuards(OrganizationRoleGuard)
  @OrgRole(OrganizationRole.ADMIN)
  async updateOrg(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Body() updateOrgDto: UpdateOrgDto,
    @Req() req,
  ) {
    return this.organizationService.updateOrg(updateOrgDto, orgId, req.user.id);
  }

  @Patch(':orgId/regenerate-invite-code')
  @UseGuards(OrganizationRoleGuard)
  @OrgRole(OrganizationRole.ADMIN)
  async regenerateInviteCode(@Param('orgId', ParseUUIDPipe) orgId: string) {
    return this.organizationService.regenerateInviteCode(orgId);
  }

  @Public()
  @Get(':orgId/members')
  async getAllOrgMembers(@Param('orgId', ParseUUIDPipe) orgId: string) {
    return this.organizationService.getAllOrgMembers(orgId);
  }

  @Patch(':orgId/members/:userId/promote')
  @UseGuards(OrganizationRoleGuard)
  @OrgRole(OrganizationRole.ADMIN)
  async promote(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.organizationService.promote(orgId, userId);
  }

  @Patch(':orgId/members/:userId/demote')
  @UseGuards(OrganizationRoleGuard)
  @OrgRole(OrganizationRole.ADMIN)
  async demote(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.organizationService.demote(orgId, userId);
  }

  @Delete(':orgId/members/:userId')
  @UseGuards(OrganizationRoleGuard)
  @OrgRole(OrganizationRole.ADMIN)
  async removeMember(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Req() req,
  ) {
    return this.organizationService.removeMember(orgId, userId, req.user.id);
  }

  @Delete(':orgId/leave')
  async leaveOrg(@Param('orgId', ParseUUIDPipe) orgId: string, @Req() req) {
    return this.organizationService.leaveOrg(orgId, req.user.id);
  }

  @Delete(':orgId')
  @UseGuards(OrganizationRoleGuard)
  @OrgRole(OrganizationRole.ADMIN)
  async deleteOrg(@Param('orgId', ParseUUIDPipe) orgId: string) {
    return this.organizationService.deleteOrg(orgId);
  }

  @Post(':orgId/request-verification')
  @UseGuards(OrganizationRoleGuard)
  @OrgRole(OrganizationRole.ADMIN)
  async requestVerifyOrgDomain(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Body() verifyOrganizationReqDto: VerifyOrganizationRequestDto,
  ) {
    return this.organizationService.requestVerifyOrgDomain(
      orgId,
      verifyOrganizationReqDto,
    );
  }

  @Post('/verify')
  @Public()
  @UseGuards(DeveloperGuard)
  async verifyOrgDomain(@Body() verifyOrganizationDto: VerifyOrganizationDto) {
    return this.organizationService.verifyOrgDomain(verifyOrganizationDto);
  }

  @Post(':orgId/report')
  @UseGuards(RoleGuard)
  @Role(UserRole.CANDIDATE)
  async createReport(
    @Param('orgId', ParseUUIDPipe) orgId: string,
    @Req() req,
    @Body() createReportDto: CreateReportDto,
  ) {
    return this.organizationService.createReport(
      orgId,
      req.user.id,
      createReportDto,
    );
  }
}
