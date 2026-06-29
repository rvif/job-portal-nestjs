import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Application } from './entities/application.entity';
import { Repository } from 'typeorm';
import { JobsService } from 'src/jobs/jobs.service';
import { OrganizationService } from 'src/organization/organization.service';
import { RecruiterUpdateApplicationDto } from './dto/recruiter-update-application.dto';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,
    private readonly jobsService: JobsService,
    private readonly orgService: OrganizationService,
  ) {}

  async create(jobId: string, userId: string) {
    // find if job exists
    const { job } = await this.jobsService.getJobById(jobId, true);

    // job active?
    if (!job.isActive) {
      throw new NotFoundException('Job has been deleted or moved.');
    }

    // avoid reapplication
    const applicationEntry = await this.applicationRepo.findOne({
      where: {
        job: {
          id: jobId,
        },
        applicant: {
          id: userId,
        },
      },
    });

    if (applicationEntry) {
      throw new ConflictException(
        "You've already applied to this job. Can't re-apply. You can update your application instead.",
      );
    }

    // create application
    const application = this.applicationRepo.create({
      applicant: {
        id: userId,
      },
      job: {
        id: jobId,
      },
    });

    await this.applicationRepo.save(application);

    return {
      message: `Applied successfully. Your application Id: ${application.id}`,
    };
  }

  async findAllApplicationsByUserId(userId) {
    const [applicationEntry, count] = await this.applicationRepo.findAndCount({
      where: {
        applicant: {
          id: userId,
        },
      },
      relations: {
        job: true,
      },
    });

    return {
      count,
      applications: applicationEntry,
    };
  }

  async getMyApplicationById(appId: string, userId: string) {
    const applicationEntry = await this.applicationRepo.findOne({
      where: { id: appId },
    });

    if (!applicationEntry) {
      throw new NotFoundException("Application doesn't exist");
    }

    if (applicationEntry.applicant.id !== userId) {
      throw new UnauthorizedException(
        'Cannot view applications of other candidates',
      );
    }

    return {
      application: applicationEntry,
    };
  }

  // async updateMyApplicationById(appId: string, userId: string) {
  //   const applicationEntry = await this.applicationRepo.findOne({
  //     where: { id: appId },
  //   });

  //   if (!applicationEntry) {
  //     throw new NotFoundException("Application doesn't exist");
  //   }

  //   if (applicationEntry.applicant.id !== userId) {
  //     throw new UnauthorizedException(
  //       'Cannot update applications of other candidates',
  //     );
  //   }

  //   // finish this when resume is added to UpdateDto
  // }

  async deleteApplication(appId: string, userId: string) {
    const applicationEntry = await this.applicationRepo.findOne({
      where: { id: appId },
    });

    if (!applicationEntry) {
      throw new NotFoundException("Application doesn't exist");
    }

    if (applicationEntry.applicant.id !== userId) {
      throw new UnauthorizedException(
        'Cannot delete applications of other candidates',
      );
    }

    await this.applicationRepo.delete({
      id: appId,
    });

    return {
      message: `Successfully deleted your Application with id: ${appId}`,
    };
  }

  async findApplicationsByOrgIdAndJobId(
    orgId: string,
    jobId: string,
    userId: string,
  ) {
    // check if org exists
    await this.orgService.findOneOrg(orgId);

    // check if user is a part of the org
    await this.orgService.findOneOrgMember(orgId, userId);

    // check if job valid
    await this.jobsService.getJobById(jobId);

    const [applicationEntry, count] = await this.applicationRepo.findAndCount({
      where: {
        job: {
          id: jobId,
          organization: {
            id: orgId,
          },
        },
      },
      relations: {
        applicant: true,
      },
      select: {
        applicant: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          resumeUrl: true,
          email: true,
          phoneNumber: true,
          avatarUrl: true,
          location: true,
        },
      },
    });

    return {
      count,
      applications: applicationEntry,
    };
  }

  async updateApplicationStatus(
    appId: string,
    orgId: string,
    jobId: string,
    userId: string,
    updateApplicationDto: RecruiterUpdateApplicationDto,
  ) {
    // check if org exists
    await this.orgService.findOneOrg(orgId);

    // check if user is a part of the org
    await this.orgService.findOneOrgMember(orgId, userId);

    // check if job valid
    await this.jobsService.getJobById(jobId);

    // check if application exists &&
    // update status
    const applicationEntry = await this.applicationRepo.preload({
      id: appId,
      ...updateApplicationDto,
    });

    if (!applicationEntry) {
      throw new NotFoundException("Application doesn't exist");
    }

    await this.applicationRepo.save(applicationEntry);

    return {
      updated: applicationEntry,
    };
  }
}
