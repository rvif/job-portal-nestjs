import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Application, VALID_TRANSITIONS } from './entities/application.entity';
import { Repository } from 'typeorm';
import { JobsService } from 'src/jobs/jobs.service';
import { OrganizationService } from 'src/organization/organization.service';
import { RecruiterUpdateApplicationDto } from './dto/recruiter-update-application.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,
    private readonly jobsService: JobsService,
    private readonly orgService: OrganizationService,
    private readonly cloudinaryService: CloudinaryService,

    @InjectQueue('email-queue')
    private readonly emailQueue: Queue,
  ) {}

  async create(jobId: string, userId: string, file: Express.Multer.File) {
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
    // try to upload resume
    const apiResp = await this.cloudinaryService.uploadFile(file);
    const { public_id, secure_url } = apiResp;

    // create application

    const application = this.applicationRepo.create({
      applicant: {
        id: userId,
      },
      job: {
        id: jobId,
      },
      resumePublicId: public_id,
    });

    await this.applicationRepo.save(application);

    return {
      message: `Applied successfully. Your application Id: ${application.id}`,
      secure_url,
      public_id,
    };
  }

  async updateMyApplicationById(
    appId: string,
    userId: string,
    file: Express.Multer.File,
  ) {
    // find application, and verify it belongs to current user
    const { application } = await this.getMyApplicationById(appId, userId);
    const oldResumePublicId = application.resumePublicId;

    // upload the new resume
    const apiResp = await this.cloudinaryService.uploadFile(file);
    const { public_id, secure_url } = apiResp;

    // update db with new resumePublicId
    const updatedApplicationEntry = this.applicationRepo.merge(application, {
      resumePublicId: public_id,
    });
    await this.applicationRepo.save(updatedApplicationEntry);

    // delete the old resume from cloudinary
    await this.cloudinaryService.deleteFile(oldResumePublicId);

    return {
      message: 'Updated your application successfully.',
      updated_application: updatedApplicationEntry,
      secure_url,
    };
  }

  async findAllApplicationsByUserId(userId: string) {
    const [applicationEntry, count] = await this.applicationRepo.findAndCount({
      where: {
        applicant: {
          id: userId,
        },
      },
    });

    return {
      count,
      applications: applicationEntry,
    };
  }

  async getMyApplicationById(appId: string, userId: string) {
    const applicationEntry = await this.applicationRepo.findOne({
      where: {
        id: appId,
        applicant: {
          id: userId,
        },
      },
    });

    if (!applicationEntry) {
      throw new NotFoundException("Application doesn't exist");
    }

    return {
      application: applicationEntry,
    };
  }

  private async getApplicationById(appId: string) {
    // load every relations (applicants, orgs, job, etc... this is just a helper function for other methods
    const applicationEntry = await this.applicationRepo.findOne({
      where: {
        id: appId,
      },
      relations: {
        applicant: true,
        job: {
          organization: true, // drill down
        },
      },
    });

    if (!applicationEntry) {
      throw new NotFoundException("Application doesn't exist");
    }

    return {
      application: applicationEntry,
    };
  }

  async deleteApplication(appId: string, userId: string) {
    const applicationEntry = await this.applicationRepo.findOne({
      where: { id: appId, applicant: { id: userId } },
    });

    if (!applicationEntry) {
      throw new NotFoundException("Application doesn't exist");
    }

    await this.cloudinaryService.deleteFile(applicationEntry.resumePublicId);

    await this.applicationRepo.remove(applicationEntry);

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

  async findApplicationsByOrgId(orgId: string) {
    // check if org exists
    await this.orgService.findOneOrg(orgId);

    const [applicationEntry, count] = await this.applicationRepo.findAndCount({
      where: {
        job: {
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
          email: true,
          phoneNumber: true,
          avatarUrl: true,
          location: true,
        },
      },
      order: {
        createdAt: 'ASC',
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

    // check if application exists
    const { application } = await this.getApplicationById(appId);

    // check if transistion is valid
    const current = application.status;
    const next = updateApplicationDto.status;

    if (!VALID_TRANSITIONS[current].includes(next)) {
      throw new BadRequestException(
        `Can't move application from ${current} to ${next}`,
      );
    }

    // update status
    const updatedApplicationEntry = this.applicationRepo.merge(application, {
      status: next,
    });
    await this.applicationRepo.save(updatedApplicationEntry);

    // send a mail notifying the candidate on their application status change
    const { applicant, job, ...updatedApplication } = updatedApplicationEntry;
    const candidateEmailAddr = applicant.email;

    await this.emailQueue.add(
      'send-email',
      {
        to: candidateEmailAddr,
        subject: 'Job Application Status Changed',
        body: `Hello ${applicant.firstName}, We'd like to inform you that your application's status for the Organization: ${job.organization.name} & Job title: ${job.title} has now changed to "${next.toUpperCase()}`,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    );

    return {
      updated: updatedApplication,
      message:
        'Application status update successful, Email queued successfully',
    };
  }
}
