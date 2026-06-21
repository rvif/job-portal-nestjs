import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  OrganizationMember,
  OrganizationRole,
} from '../entities/organization-members.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ORG_ROLE_KEY } from '../decorators/organization-role.decorator';

@Injectable()
export class OrganizationRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,

    @InjectRepository(OrganizationMember)
    private readonly organizationMemberRepo: Repository<OrganizationMember>,
  ) {}

  async canActivate(context: ExecutionContext) {
    const requiredOrgRole = this.reflector.getAllAndOverride<OrganizationRole>(
      ORG_ROLE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredOrgRole) {
      // if metadata not attached let request pass
      return true;
    }

    const req = context.switchToHttp().getRequest();
    const orgId = req.params.orgId;
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
      throw new ForbiddenException(
        'Cant update, You dont belong to that organization',
      );
    }

    if (requiredOrgRole !== orgMemberEntry.role) {
      throw new ForbiddenException('Admin access required');
    }

    return true;
  }
}
