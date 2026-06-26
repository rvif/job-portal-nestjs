import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateJobDto } from './dto/create-job.dto';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';
import { OrganizationRole } from 'src/organization/entities/organization-members.entity';
import { OrganizationService } from 'src/organization/organization.service';
import { Job } from './entities/job.entity';
import { UpdateJobDto } from './dto/update-job.dto';
import { QueryJobDto } from './dto/query-job.dto';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job)
    private readonly jobsRepo: Repository<Job>,

    private readonly orgService: OrganizationService,
  ) {}

  async create(orgId: string, userId: string, createJobDto: CreateJobDto) {
    const orgEntry = await this.orgService.findOneOrg(orgId);
    const { salaryMin, salaryMax } = createJobDto;
    if (salaryMin > salaryMax) {
      throw new BadRequestException(
        'Minimum salary cannot exceed maximum salary',
      );
    }
    const jobEntry = this.jobsRepo.create({
      ...createJobDto,
      organization: {
        id: orgEntry.id,
      },
      createdBy: {
        id: userId,
      },
    });

    await this.jobsRepo.save(jobEntry);
    return {
      message: 'Job created successfully',
      created: jobEntry,
    };
  }

  async update(orgId: string, jobId: string, updateJobDto: UpdateJobDto) {
    // guard only checks if user belongs to the org and satisfies the roles required.

    // check if job also belongs to the org first before updating or deleting it
    const jobEntry = await this.jobsRepo.findOne({
      where: {
        id: jobId,
      },
      relations: {
        organization: true,
      },
    });

    if (!jobEntry) {
      throw new NotFoundException('Job with id not found');
    }

    if (jobEntry.organization.id !== orgId) {
      throw new UnauthorizedException(
        "Job doesn't belong to your organization",
      );
    }

    // continue with update
    const updatedJobEntry = await this.jobsRepo.preload({
      id: jobId,
      ...updateJobDto,
    });

    if (!updatedJobEntry) {
      throw new NotFoundException('Job not found');
    }

    await this.jobsRepo.save(updatedJobEntry);
    return {
      message: 'Job updated successfully',
      updated: updatedJobEntry,
    };
  }

  async delete(orgId: string, jobId: string, userId: string) {
    const jobEntry = await this.jobsRepo.findOne({
      where: {
        id: jobId,
      },
      relations: {
        createdBy: true,
        organization: true,
      },
    });

    if (!jobEntry) {
      throw new NotFoundException('Job with id not found');
    }

    if (jobEntry.organization.id !== orgId) {
      throw new UnauthorizedException(
        "Job doesn't belong to your organization",
      );
    }

    // only admin or job creator can delete the job
    const orgMemberEntry = await this.orgService.findOneOrgMember(
      orgId,
      userId,
    );
    if (
      orgMemberEntry.role !== OrganizationRole.ADMIN &&
      jobEntry.createdBy.id !== userId
    ) {
      throw new UnauthorizedException(
        'Cannot Delete, Only org admins or the job creator can delete this job.',
      );
    }

    // soft delete the job
    if (!jobEntry.isActive) {
      // if the job exist and is already soft deleted, just throw this
      throw new NotFoundException('Job doesnt exist');
    }

    jobEntry.isActive = false;
    await this.jobsRepo.save(jobEntry);

    return {
      message: 'Job deleted successfully',
      method: 'soft-delete',
    };
  }

  // public get job methods
  async getAllJobs(query: QueryJobDto) {
    const qb = this.jobsRepo
      .createQueryBuilder('job')
      .where('job.isActive = true');

    if (query.title) {
      qb.andWhere('LOWER(job.title) LIKE LOWER(:title)', {
        title: `%${query.title}%`,
      });
    }

    if (query.location) {
      qb.andWhere('LOWER(job.location) = LOWER(:location)', {
        location: query.location,
      });
    }

    if (query.salaryMin !== undefined) {
      // if (query.salaryMin) {} if query.salaryMin is zero, this if block wont work so check if its not undefined instead
      qb.andWhere('job.salaryMin >= :salaryMin', {
        salaryMin: query.salaryMin,
      });
    }

    if (query.salaryMax !== undefined) {
      qb.andWhere('job.salaryMax <= :salaryMax', {
        salaryMax: query.salaryMax,
      });
    }

    if (query.isRemote !== undefined) {
      // if(query.isRemote) {} if query.isRemote is false, this if block wont work so check if its not undefined instead
      qb.andWhere('job.isRemote = :isRemote', {
        isRemote: query.isRemote,
      });
    }

    if (query.employmentType) {
      qb.andWhere('job.employmentType = :employmentType', {
        employmentType: query.employmentType,
      });
    }

    if (query.experienceLevel) {
      qb.andWhere('job.experienceLevel = :experienceLevel', {
        experienceLevel: query.experienceLevel,
      });
    }

    const [jobs, count] = await qb.getManyAndCount();

    return {
      count,
      jobs,
    };
  }

  async getJobById(jobId: string) {
    const jobEntry = await this.jobsRepo.findOne({
      where: {
        id: jobId,
      },
    });

    if (!jobEntry) {
      throw new NotFoundException('Job not found');
    }

    return {
      job: jobEntry,
    };
  }

  // get org job methods
  async getJobsByOrgId(orgId: string) {
    const [jobEntries, count] = await this.jobsRepo.findAndCount({
      where: {
        organization: {
          id: orgId,
        },
      },
      relations: {
        organization: true,
      },
    });

    if (!count) {
      throw new NotFoundException(
        'Organization has no available jobs at the moment.',
      );
    }

    return {
      count,
      jobs: jobEntries,
    };
  }

  async getJobsByRecruiter(orgId: string, userId: string) {
    const orgMemberEntry = await this.orgService.findOneOrgMember(
      orgId,
      userId,
    );

    if (!orgMemberEntry) {
      throw new BadRequestException(
        "User id doesn't exist inside organization",
      );
    }

    const [jobEntries, count] = await this.jobsRepo.findAndCount({
      where: {
        createdBy: {
          id: userId,
        },
      },
      relations: {
        createdBy: true,
      },
    });

    if (!count) {
      throw new NotFoundException('Recruiter has created no jobs yet.');
    }

    return {
      count,
      jobs: jobEntries,
    };
  }

  async getJobByOrgIdAndJobId(orgId: string, jobId: string) {
    const jobEntry = await this.jobsRepo.findOne({
      where: {
        id: jobId,
        organization: {
          id: orgId,
        },
      },
      relations: {
        organization: true,
      },
    });

    if (!jobEntry) {
      throw new NotFoundException("Job doesn't exist");
    }

    return {
      job: jobEntry,
    };
  }
}
