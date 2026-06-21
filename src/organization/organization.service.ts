import {
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

@Injectable()
export class OrganizationService {
  constructor(
    @InjectRepository(Organization)
    private readonly organizationRepo: Repository<Organization>,

    @InjectRepository(OrganizationMember)
    private readonly organizationMemberRepo: Repository<OrganizationMember>,
  ) {}

  async create(createOrgDto: CreateOrgDto, userId) {
    const { name } = createOrgDto;

    const org = await this.organizationRepo.findOne({
      where: {
        name,
      },
    });

    if (org) {
      throw new ConflictException('Organization with name already exists');
    }

    const inviteCode = this.generateInviteCode();

    const orgEntry = this.organizationRepo.create({
      ...createOrgDto,
      joinCode: inviteCode,
    });
    await this.organizationRepo.save(orgEntry);

    // first member in the org, so dont check anything
    const organizationId = orgEntry.id;
    const orgMemberEntry = this.organizationMemberRepo.create({
      organization: {
        id: organizationId,
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

  async findAllOrgs(userId: string) {
    const orgMembershipEntry = await this.organizationMemberRepo.find({
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

    if (orgMembershipEntry.length === 0) {
      throw new NotFoundException("You don't belong to any organization yet");
    }

    return {
      orgMembershipEntry,
    };
  }

  async findOne(id: string) {
    const orgEntry = await this.organizationRepo.findOne({
      where: {
        id,
      },
    });

    const countOfMembersByOrg = await this.organizationMemberRepo.count({
      where: {
        organization: {
          id,
        },
      },
    });

    if (!orgEntry) {
      throw new NotFoundException(`Organization with Id: ${id} doesn't exists`);
    }

    return {
      orgEntry,
      membersCount: countOfMembersByOrg,
    };
  }

  async joinOrg(joinOrgDto: JoinOrgDto, userId: string) {
    const { id, inviteCode } = joinOrgDto; // id is orgId
    // check org exists
    const orgEntry = await this.organizationRepo.findOne({
      where: {
        id,
      },
      select: {
        name: true,
        joinCode: true, // explicitly select joinCode
      },
    });
    if (!orgEntry) {
      throw new NotFoundException("Organization doesn't exist");
    }
    // user is already member?
    let orgMemberEntry = await this.organizationMemberRepo.findOne({
      where: {
        organization: {
          id,
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
    console.log(orgEntry.joinCode);
    if (orgEntry.joinCode !== inviteCode) {
      throw new ForbiddenException('Invalid invite code');
    }

    // let them join
    orgMemberEntry = this.organizationMemberRepo.create({
      organization: {
        id,
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
    // check if org exists
    const orgEntry = await this.organizationRepo.findOne({
      where: {
        id: orgId,
      },
    });

    if (!orgEntry) {
      throw new NotFoundException("Organization doesn't exist");
    }

    // user-org relation existence in orgMember table and admin validation is taken care of by the orgRole guard

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
  private generateInviteCode(): string {
    // 8 digit organization invite code
    return Math.floor(10000000 + Math.random() * 90000000).toString();
  }
}
