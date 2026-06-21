import { User } from 'src/users/users.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Organization } from './organization.entity';

export enum OrganizationRole {
  ADMIN = 'admin',
  MEMBER = 'member',
}

@Entity('organization_members')
export class OrganizationMember {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, (user) => user.organizationMemberships)
  user!: User;

  @ManyToOne(() => Organization, (organization) => organization.members)
  organization!: Organization;

  @Column('enum', { enum: OrganizationRole })
  role!: OrganizationRole;

  @CreateDateColumn()
  createdAt!: Date;
}
