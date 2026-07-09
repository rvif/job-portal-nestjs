import {
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { OrgRole } from 'src/organization/decorators/organization-role.decorator';
import { OrganizationRole } from 'src/organization/entities/organization-members.entity';
import { OrganizationRoleGuard } from 'src/organization/guards/organization-role.guard';
import { DashboardService } from './dashboard.service';
import { DeveloperGuard } from 'src/common/guards/developer.guard';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { OnboardingGuard } from 'src/common/guards/onboarding.guard';

@Controller('dashboard')
@UseGuards(OnboardingGuard)
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,

    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  @Get(':orgId')
  @UseGuards(OrganizationRoleGuard)
  @OrgRole(OrganizationRole.ADMIN, OrganizationRole.MEMBER)
  async getOrgDashboard(@Param('orgId', ParseUUIDPipe) orgId: string) {
    return this.dashboardService.getDashboard(orgId);
  }

  @Delete('clear-cache')
  @UseGuards(DeveloperGuard)
  async clearAllCache() {
    await this.cacheManager.clear();
    return { message: 'Redis cache cleared successfully' };
  }
}
