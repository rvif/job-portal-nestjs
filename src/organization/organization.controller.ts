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
import { UserRole } from 'src/users/users.entity';
import { CreateOrgDto } from './dto/create-organization.dto';
import { OrganizationService } from './organization.service';
import { Public } from 'src/auth/decorators/public.decorator';
import { JoinOrgDto } from './dto/join-organization.dto';
import { UpdateOrgDto } from './dto/update-organization.dto';
import { OrgRole } from './decorators/organization-role.decorator';
import { OrganizationRole } from './entities/organization-members.entity';
import { OrganizationRoleGuard } from './guards/organization-role.guard';

@Controller('organization')
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
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) orgId: string) {
    return this.organizationService.findOne(orgId);
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
}
