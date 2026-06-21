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

  async findOne(orgId: string) {
    const orgEntry = await this.findOneOrg(orgId);

    const countOfMembersByOrg = await this.organizationMemberRepo.count({
      where: {
        organization: {
          id: orgId,
        },
      },
    });

    return {
      orgEntry,
      membersCount: countOfMembersByOrg,
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

  private async findOneOrg(orgId: string) {
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

  private async findOneOrgMember(orgId: string, userId: string) {
    const exists = await this.organizationRepo.exists({ where: { id: orgId } });
    if (!exists) {
      throw new NotFoundException("Organization with id doesn't exist");
    }

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
