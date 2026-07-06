import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrganizationMember } from './organization-members.entity';
import { Job } from 'src/jobs/entities/job.entity';
import { OrganizationVerificationRequest } from './organization-verification-requests.entity';
import { OrganizationReport } from './organization-reports.entity';

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  name!: string;

  @Column('varchar', { nullable: true })
  website?: string;

  @OneToMany(() => OrganizationMember, (member) => member.organization)
  members?: OrganizationMember[];

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  address?: string;

  @Column({ unique: true, nullable: true })
  logoUrl?: string;

  @Column({ nullable: true })
  bannerUrl?: string;

  @Column({ unique: true, select: false })
  joinCode!: string;

  @OneToMany(() => Job, (job) => job.organization)
  jobs?: Job[];

  @Column('varchar', { nullable: true })
  verifiedDomain?: string;

  @Column('boolean', { default: false })
  isVerified!: boolean;

  @Column('timestamp without time zone', { nullable: true })
  verifiedAt?: Date;

  @OneToOne(
    () => OrganizationVerificationRequest,
    (request) => request.organization,
  )
  verifyRequest!: OrganizationVerificationRequest;

  @OneToMany(
    () => OrganizationReport,
    (organizationReport) => organizationReport.organization,
  )
  reports?: OrganizationReport[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
