import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cache } from 'cache-manager';
import { ApplicationsService } from 'src/applications/applications.service';
import {
  Application,
  ApplicationStatus,
} from 'src/applications/entities/application.entity';
import { Job } from 'src/jobs/entities/job.entity';
import {
  OrganizationMember,
  OrganizationRole,
} from 'src/organization/entities/organization-members.entity';
import { OrganizationService } from 'src/organization/organization.service';
import { Repository } from 'typeorm';

@Injectable()
export class DashboardService {
  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly organizationService: OrganizationService,
    private readonly applicationsService: ApplicationsService,

    @InjectRepository(OrganizationMember)
    private readonly organizationMemberRepo: Repository<OrganizationMember>,

    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,

    @InjectRepository(Job)
    private readonly jobsRepo: Repository<Job>,
  ) {}

  async getDashboard(orgId: string) {
    const cacheKey = `dashboard:org:${orgId}`;

    const cachedData = await this.cacheManager.get(cacheKey);
    if (cachedData) {
      // console.log('returning cached data');
      return cachedData;
    }

    const orgEntry = await this.organizationService.findOneOrg(orgId);
    const [, totalMemberCount] = await this.organizationMemberRepo.findAndCount(
      {
        where: {
          organization: {
            id: orgId,
          },
        },
      },
    );

    const [, adminCount] = await this.organizationMemberRepo.findAndCount({
      where: {
        organization: {
          id: orgId,
        },
        role: OrganizationRole.ADMIN,
      },
    });

    const [allJobs, totalJobCount] = await this.jobsRepo
      .createQueryBuilder('job')
      .where('job.organization.id = :id', { id: orgId })
      .addSelect('job.isActive')
      .getManyAndCount();

    const [, activeJobCount] = await this.jobsRepo.findAndCount({
      where: {
        organization: {
          id: orgId,
        },
        isActive: true,
      },
      select: {
        isActive: true,
      },
    });

    const [, inactiveJobCount] = await this.jobsRepo.findAndCount({
      where: {
        organization: {
          id: orgId,
        },
        isActive: false,
      },
      select: {
        isActive: true,
      },
    });

    const allApplications =
      await this.applicationsService.findApplicationsByOrgId(orgId);

    const [, appliedCount] = await this.applicationRepo.findAndCount({
      where: {
        job: {
          organization: {
            id: orgId,
          },
        },
        status: ApplicationStatus.APPLIED,
      },
    });

    const [, hiredCount] = await this.applicationRepo.findAndCount({
      where: {
        job: {
          organization: {
            id: orgId,
          },
        },
        status: ApplicationStatus.HIRED,
      },
    });
    const [, shortlistedCount] = await this.applicationRepo.findAndCount({
      where: {
        job: {
          organization: {
            id: orgId,
          },
        },
        status: ApplicationStatus.SHORTLISTED,
      },
    });
    const [, reviewingCount] = await this.applicationRepo.findAndCount({
      where: {
        job: {
          organization: {
            id: orgId,
          },
        },
        status: ApplicationStatus.REVIEWING,
      },
    });
    const [, rejectedCount] = await this.applicationRepo.findAndCount({
      where: {
        job: {
          organization: {
            id: orgId,
          },
        },
        status: ApplicationStatus.REJECTED,
      },
    });

    let dashboard = {
      organization: {
        id: orgEntry.id,
        name: orgEntry.name,
        logo: orgEntry.logoUrl || 'No logo',
        description: orgEntry.description || 'No description',
        verified: orgEntry.isVerified,
      },
      stats: {
        totalMembers: {
          count: totalMemberCount,
          admin: adminCount,
          member: totalMemberCount - adminCount,
        },
        totalJobs: {
          count: totalJobCount,
          activeJobs: activeJobCount,
          inactiveJobs: inactiveJobCount,
        },

        totalApplications: {
          count: allApplications.count,
          applied: appliedCount,
          hired: hiredCount,
          shortlisted: shortlistedCount,
          reviewing: reviewingCount,
          rejected: rejectedCount,
        },
      },
      latestJobs: { ...allJobs },
      latestApplications: {
        ...allApplications.applications,
      },
    };

    this.cacheManager.set(cacheKey, dashboard, 5 * 60 * 1000); // 5 minute ttl specified separately, this will override ttl defined during registration.
    // console.log('caching data');
    return dashboard;
  }
}
