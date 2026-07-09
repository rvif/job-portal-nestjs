import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateOrgDto } from './dto/create-organization.dto';
import { Repository } from 'typeorm';
import { Organization } from './entities/organization.entity';
import { InjectRepository } from '@nestjs/typeorm';
import {
  OrganizationMember,
  OrganizationRole,
} from './entities/organization-members.entity';
import { JoinOrgDto } from './dto/join-organization.dto';
import { UpdateOrgDto } from './dto/update-organization.dto';
import { VerifyOrganizationDto } from './dto/verify-organization.dto';
import {
  OrganizationVerificationRequest,
  VerificationStatus,
} from './entities/organization-verification-requests.entity';
import { VerifyOrganizationRequestDto } from './dto/verify-organization-request.dto';
import { CreateReportDto } from './dto/create-report.dto';
import { OrganizationReport } from './entities/organization-reports.entity';
import { MailService } from 'src/mail/mail.service';
import { Job } from 'src/jobs/entities/job.entity';
import { QueryOrgJobDto } from './dto/query-org-job.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class OrganizationService {
  constructor(
    @InjectRepository(Organization)
    private readonly organizationRepo: Repository<Organization>,

    @InjectRepository(OrganizationMember)
    private readonly organizationMemberRepo: Repository<OrganizationMember>,

    @InjectRepository(OrganizationVerificationRequest)
    private readonly organizationVerificationReqRepo: Repository<OrganizationVerificationRequest>,

    @InjectRepository(OrganizationReport)
    private readonly organizationReportRepo: Repository<OrganizationReport>,

    @InjectRepository(Job)
    private readonly jobsRepo: Repository<Job>,

    @InjectQueue('email-queue')
    private readonly emailQueue: Queue,
  ) {}

  async create(createOrgDto: CreateOrgDto, userId) {
    const { name } = createOrgDto;

    const exists = await this.organizationRepo.exists({
      where: {
        name,
      },
    });

    if (exists) {
      throw new ConflictException('Organization with name already exists');
    }

    const inviteCode = this.generateInviteCode();
    const orgEntry = this.organizationRepo.create({
      ...createOrgDto,
      joinCode: inviteCode,
    });
    await this.organizationRepo.save(orgEntry);

    // first member in the org, so dont check anything

    const orgMemberEntry = this.organizationMemberRepo.create({
      organization: {
        id: orgEntry.id,
      },
      user: {
        id: userId,
      },
      role: OrganizationRole.ADMIN,
    });

    await this.organizationMemberRepo.save(orgMemberEntry);

    return {
      message: 'Your organization was created successfully',
      inviteCode,
    };
  }

  async findAllOrgsByUserId(userId: string) {
    const orgMemberEntry = await this.organizationMemberRepo.find({
      where: {
        user: {
          id: userId,
        },
      },
      relations: {
        organization: true,
      },
      select: {
        id: true,
        organization: {
          id: true,
          name: true,
        },
        role: true,
      },
    }); // will return empty array if no records found

    if (orgMemberEntry.length === 0) {
      throw new NotFoundException("You don't belong to any organization yet");
    }

    return {
      orgMemberEntry,
    };
  }

  async findOneOrgPublic(orgId: string) {
    const orgEntry = await this.findOneOrg(orgId);

    const countOfMemberInOrg = await this.organizationMemberRepo.count({
      where: {
        organization: {
          id: orgId,
        },
      },
    });

    const countOfActiveJobs = await this.jobsRepo.count({
      where: {
        organization: {
          id: orgId,
        },
        isActive: true,
      },
    });

    const { id, logoUrl, website, createdAt, isVerified } = orgEntry;

    return {
      id,
      logo: logoUrl,
      website,
      membersCount: countOfMemberInOrg,
      activeJobs: countOfActiveJobs,
      verified: isVerified,
      createdAt,
    };
  }

  async findAllJobsByOrg(orgId: string, query: QueryOrgJobDto) {
    const { sortBy, sortOrder, page, limit } = query;
    const offset = (page - 1) * limit;
    const qb = this.jobsRepo
      .createQueryBuilder('job')
      .where('job.organizationId = :orgId', { orgId })
      .andWhere('job.isActive = true');

    if (query.title) {
      qb.andWhere('LOWER(job.title) LIKE LOWER(:title)', {
        title: `%${query.title}%`,
      });
    }

    if (query.search) {
      qb.andWhere(
        `(
        LOWER(job.title) LIKE LOWER(:search) 
        OR 
        LOWER(job.description) LIKE LOWER(:search)
        )`,
        {
          search: `%${query.search}%`,
        },
      );
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

    const [jobs, count] = await qb
      .orderBy(`job.${sortBy}`, sortOrder)
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    return {
      count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
      jobs,
      sortBy,
      sortOrder,
    };
  }

  async joinOrg(joinOrgDto: JoinOrgDto, userId: string) {
    const { orgId, inviteCode } = joinOrgDto; // id is orgId
    // check org exists | dont use findOneOrg() as it doesn't explicitly selects the "joinCode" field
    const orgEntry = await this.organizationRepo.findOne({
      where: {
        id: orgId,
      },
      select: {
        name: true,
        joinCode: true, // explicitly select joinCode
      },
    });
    if (!orgEntry) {
      throw new NotFoundException("Organization doesn't exist");
    }

    // user is already member? | dont use findOneOrgMember(), as the we are trying to create one in the first place
    let orgMemberEntry = await this.organizationMemberRepo.findOne({
      where: {
        organization: {
          id: orgId,
        },
        user: {
          id: userId,
        },
      },
    });

    if (orgMemberEntry) {
      throw new ConflictException('You already belong to the organization');
    }
    // invite code valid?
    // console.log(orgEntry.joinCode);
    if (orgEntry.joinCode !== inviteCode) {
      throw new ForbiddenException('Invalid invite code');
    }

    // let them join
    orgMemberEntry = this.organizationMemberRepo.create({
      organization: {
        id: orgId,
      },
      role: OrganizationRole.MEMBER,
      user: {
        id: userId,
      },
    });

    await this.organizationMemberRepo.save(orgMemberEntry);
    return {
      message: `Joined ${orgEntry.name} successfully`,
    };
  }

  async updateOrg(updateOrgDto: UpdateOrgDto, orgId: string, userId: string) {
    // org, user-org existence and admin validation is taken care of by the orgRole guard

    // update org details except joinCode
    const updatedOrgEntry = await this.organizationRepo.preload({
      id: orgId,
      ...updateOrgDto,
    });

    if (updatedOrgEntry) {
      await this.organizationRepo.save(updatedOrgEntry);
    }

    return {
      message: 'Updated organization details successfully',
      updatedOrgEntry,
    };
  }

  async regenerateInviteCode(orgId: string) {
    const newInviteCode = this.generateInviteCode();
    const updatedOrgEntry = await this.organizationRepo.preload({
      id: orgId,
      joinCode: newInviteCode,
    });

    // orgId is valid, guaranteed by guard but still add the following
    if (!updatedOrgEntry) {
      throw new NotFoundException("Organization with id doesn't exist");
    }

    await this.organizationRepo.save(updatedOrgEntry);
    return {
      message: `Regeneration of invite code successful for ${updatedOrgEntry.name}`,
      inviteCode: newInviteCode,
    };
  }

  async getAllOrgMembers(orgId: string) {
    await this.findOneOrg(orgId);

    const orgMemberEntry = await this.organizationMemberRepo.find({
      where: {
        organization: {
          id: orgId,
        },
      },
      relations: {
        user: true,
      },
      select: {
        role: true,
        user: {
          firstName: true,
          lastName: true,
          // email: true, // revert later, sharing email of all recruiters on a public route isn't a good idea
        },
      },
    });

    return {
      members: orgMemberEntry,
    };
  }
  async promote(orgId: string, userId: string) {
    const orgMemberEntry = await this.findOneOrgMember(orgId, userId);

    // no admin -> admin promotions

    if (orgMemberEntry.role === OrganizationRole.ADMIN) {
      throw new ConflictException(
        "User is already ADMIN, can't promote further",
      );
    }

    orgMemberEntry.role = OrganizationRole.ADMIN;
    await this.organizationMemberRepo.save(orgMemberEntry);
    return {
      message: 'User has been promoted successfully',
    };
  }

  async demote(orgId: string, userId: string) {
    const orgMemberEntry = await this.findOneOrgMember(orgId, userId);

    // no member -> member demotions

    if (orgMemberEntry.role === OrganizationRole.MEMBER) {
      throw new ConflictException(
        "User is already MEMBER, can't demote further",
      );
    }

    orgMemberEntry.role = OrganizationRole.MEMBER;
    await this.organizationMemberRepo.save(orgMemberEntry);
    return {
      message: 'User has been demoted successfully',
    };
  }

  async leaveOrg(orgId: string, userId: string) {
    const orgEntry = await this.findOneOrg(orgId);
    const orgMemberEntry = await this.findOneOrgMember(orgId, userId);

    // if this is the last / only admin for this org, dont let the deletion go through
    const countOrgAdmins = await this.organizationMemberRepo.count({
      where: {
        organization: {
          id: orgId,
        },
        role: OrganizationRole.ADMIN,
      },
    });

    if (
      countOrgAdmins === 1 &&
      orgMemberEntry.role === OrganizationRole.ADMIN
    ) {
      throw new BadRequestException(
        'You are the only ADMIN for this org. Cannot leave until someone else is promoted',
      );
    }

    // allow deletion
    await this.organizationMemberRepo.delete({
      organization: {
        id: orgId,
      },
      user: {
        id: userId,
      },
    });

    return {
      message: `You left ${orgEntry.name} successfully`,
    };
  }

  async removeMember(orgId: string, userIdToRemove: string, ownUserId: string) {
    const orgEntry = await this.findOneOrg(orgId);
    const orgMemberEntry = await this.findOneOrgMember(orgId, userIdToRemove);

    // cannot remove yourself (use /leave instead) aslo cannot remove other admins
    if (userIdToRemove === ownUserId) {
      throw new ConflictException('Cannot remove yourself, Use /leave instead');
    }
    if (orgMemberEntry.role === OrganizationRole.ADMIN) {
      throw new BadRequestException('Cannot remove Organization ADMIN');
    }

    // allow remove
    await this.organizationMemberRepo.delete({
      user: {
        id: userIdToRemove,
      },
      organization: {
        id: orgId,
      },
    });

    return {
      message: `User was removed successfully from ${orgEntry.name}`,
    };
  }

  async deleteOrg(orgId: string) {
    const orgEntry = await this.findOneOrg(orgId);

    // delete org, all org_members and later also jobs associated with this orgs

    // delete org_members first or we will lose org foreign key reference
    const orgMemberDeleteMetadata = await this.organizationMemberRepo.delete({
      organization: {
        id: orgId,
      },
    });

    await this.organizationRepo.delete({
      id: orgId,
    });

    return {
      message: `Deleted ${orgEntry.name} and also deleted ${orgMemberDeleteMetadata.affected} members associated with the organization successfully`,
    };
  }

  async requestVerifyOrgDomain(
    orgId: string,
    verifyOrganizationReqDto: VerifyOrganizationRequestDto,
  ) {
    const { domain } = verifyOrganizationReqDto;
    const orgEntry = await this.findOneOrg(orgId);
    const orgVerifyReqEntry =
      await this.organizationVerificationReqRepo.findOne({
        where: {
          organization: {
            id: orgId,
          },
        },
      });

    if (
      orgVerifyReqEntry &&
      orgVerifyReqEntry.status === VerificationStatus.PENDING
    ) {
      throw new ConflictException(
        'Verification for your organization is already queued. Cannot apply more than once.',
      );
    }

    if (
      orgVerifyReqEntry &&
      orgVerifyReqEntry.status === VerificationStatus.REJECTED
    ) {
      throw new ConflictException(
        'Verification request for your organization was rejected. Please request again sometime later.',
      );
    }

    if (orgEntry.isVerified) {
      throw new ConflictException('Organization is already verified.');
    }

    const entry = this.organizationVerificationReqRepo.create({
      organization: {
        id: orgId,
      },
      domain,
      status: VerificationStatus.PENDING,
    });

    await this.organizationVerificationReqRepo.save(entry);
    return {
      message:
        'Verification requested, Please be patient until we process your request.',
    };
  }

  async verifyOrgDomain(verifyOrganizationDto: VerifyOrganizationDto) {
    // manual review and call this service to set verifiedDomain and isVerified fields
    const { reqId, status } = verifyOrganizationDto;
    const requestEntry = await this.organizationVerificationReqRepo.findOne({
      where: {
        id: reqId,
      },
      relations: {
        organization: true,
      },
      select: {
        organization: {
          id: true,
        },
      },
    });

    if (!requestEntry) {
      throw new NotFoundException(
        "Verification request with id doesn't exists",
      );
    }

    const orgEntry = await this.findOneOrg(requestEntry.organization.id);
    if (orgEntry.isVerified) {
      throw new ConflictException('Organization already verified.');
    }

    if (status === VerificationStatus.VERIFIED) {
      const updatedOrgEntry = this.organizationRepo.merge(orgEntry, {
        verifiedDomain: requestEntry.domain,
        isVerified: true,
        verifiedAt: new Date(),
      });

      // if verified, delete the request
      await this.organizationVerificationReqRepo.delete({
        id: reqId,
      });

      await this.organizationRepo.save(updatedOrgEntry);
      const { id, verifiedDomain, isVerified, verifiedAt } = updatedOrgEntry;
      return {
        message: 'Organization was verified, and request was deleted.',
        updated: {
          id,
          verifiedDomain,
          isVerified,
          verifiedAt,
        },
      };
    }

    requestEntry.status = status;
    await this.organizationVerificationReqRepo.save(requestEntry);
    if (status === VerificationStatus.REJECTED) {
      return {
        message: `Verification request for orgId:${requestEntry.organization.id} was rejected.`,
        request: requestEntry,
      };
    }

    return {
      request: requestEntry,
    };
  }

  async createReport(
    orgId: string,
    userId: string,
    createReportDto: CreateReportDto,
  ) {
    //    organization exists
    await this.findOneOrg(orgId);

    //    prevent duplicate open reports from same user
    const orgReportEntryBySameUser = await this.organizationReportRepo.findOne({
      where: {
        organization: {
          id: orgId,
        },
        reporter: {
          id: userId,
        },
      },
    });

    if (orgReportEntryBySameUser) {
      throw new ConflictException(
        'You have already reported this organization. Please be patient until we try to resolve the issue.',
      );
    }

    //    save report
    const orgReportEntry = this.organizationReportRepo.create({
      organization: {
        id: orgId,
      },
      reporter: {
        id: userId,
      },
      ...createReportDto,
    });

    await this.organizationReportRepo.save(orgReportEntry);

    //    send email to admins
    const orgAdminEntries = await this.organizationMemberRepo
      .createQueryBuilder('member')
      .innerJoin('member.user', 'user')
      .where('member.organizationId = :orgId', { orgId })
      .andWhere('member.role = :role', { role: OrganizationRole.ADMIN })
      .select('user.email', 'email')
      .getRawMany<{ email: string }>();

    const adminEmailAddrs = orgAdminEntries.map((row) => row.email);
    await this.emailQueue.addBulk(
      adminEmailAddrs.map((email) => ({
        name: 'send-email',
        data: {
          to: email,
          subject: 'New Organization Report Received',
          body: `We would like to inform you about your recent report from one of our users\n\nReport reason: ${orgReportEntry.reason}. \n\nPlease make sure you don't break any platform guidelines, This report will be manually reviewed soon.`,
        },
        opts: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
          removeOnComplete: 100,
          removeOnFail: 50,
        },
      })),
    );

    return {
      message: 'Report successfully submitted.',
    };
  }

  async findOneOrg(orgId: string) {
    const orgEntry = await this.organizationRepo.findOne({
      where: {
        id: orgId,
      },
    });

    if (!orgEntry) {
      throw new NotFoundException("Organization with id doesn't exist");
    }

    return orgEntry;
  }

  async findOneOrgMember(orgId: string, userId: string) {
    // check if org exists
    await this.findOneOrg(orgId);

    const orgMemberEntry = await this.organizationMemberRepo.findOne({
      where: {
        organization: {
          id: orgId,
        },
        user: {
          id: userId,
        },
      },
    });

    if (!orgMemberEntry) {
      throw new NotFoundException("User doesn't belong to the organization");
    }

    return orgMemberEntry;
  }

  private generateInviteCode(): string {
    // 8 digit organization invite code
    return Math.floor(10000000 + Math.random() * 90000000).toString();
  }
}
