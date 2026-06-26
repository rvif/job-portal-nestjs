import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  OrganizationMember,
  OrganizationRole,
} from '../entities/organization-members.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ORG_ROLE_KEY } from '../decorators/organization-role.decorator';
import { Organization } from '../entities/organization.entity';
import { isUUID } from 'class-validator';

@Injectable()
export class OrganizationRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,

    @InjectRepository(OrganizationMember)
    private readonly organizationMemberRepo: Repository<OrganizationMember>,

    @InjectRepository(Organization)
    private readonly organizationRepo: Repository<Organization>,
  ) {}

  async canActivate(context: ExecutionContext) {
    const requiredOrgRoles = this.reflector.getAllAndOverride<
      OrganizationRole[]
    >(ORG_ROLE_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredOrgRoles) {
      // if metadata not attached let request pass
      return true;
    }

    const req = context.switchToHttp().getRequest();
    const orgId = req.params.orgId;

    if (!isUUID(orgId)) {
      throw new BadRequestException('Invalid organization id');
    }
    // check org and org-member existence in guard
    const orgEntry = await this.organizationRepo.findOne({
      where: {
        id: orgId,
      },
    });

    if (!orgEntry) {
      throw new NotFoundException("Organization with id doesn't exist");
    }

    const orgMemberEntry = await this.organizationMemberRepo.findOne({
      where: {
        user: {
          id: req.user.id,
        },
        organization: {
          id: orgId,
        },
      },
    });

    if (!orgMemberEntry) {
      throw new ForbiddenException("You don't belong to that organization");
    }

    if (!requiredOrgRoles.includes(orgMemberEntry.role)) {
      throw new ForbiddenException('Insufficient organization permissions');
    }

    return true;
  }
}
