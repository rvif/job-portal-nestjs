import { SetMetadata } from '@nestjs/common';
import { OrganizationRole } from '../entities/organization-members.entity';

export const ORG_ROLE_KEY = 'organization_role';
export const OrgRole = (orgRole: OrganizationRole) =>
  SetMetadata(ORG_ROLE_KEY, orgRole);
