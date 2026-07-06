import { User } from 'src/users/users.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Organization } from './organization.entity';

export enum ReportStatus {
  OPEN = 'open',
  UNDER_REVIEW = 'under_review',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

@Entity('organization_reports')
export class OrganizationReport {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Organization, (organization) => organization.reports)
  organization!: Organization;

  @ManyToOne(() => User, (user) => user.reports, { onDelete: 'CASCADE' })
  reporter!: User;

  @Column('varchar', { nullable: false })
  reason!: string;

  @Column('varchar', { nullable: true })
  description?: string;

  @Column({ enum: ReportStatus, default: ReportStatus.OPEN })
  status!: ReportStatus;

  @CreateDateColumn()
  createdAt!: Date;
}
