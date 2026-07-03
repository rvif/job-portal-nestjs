import { Job } from 'src/jobs/entities/job.entity';
import { User } from 'src/users/users.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ApplicationStatus {
  APPLIED = 'applied',
  REVIEWING = 'reviewing',
  SHORTLISTED = 'shortlisted',
  REJECTED = 'rejected',
  HIRED = 'hired',
}

export const VALID_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> =
  {
    [ApplicationStatus.APPLIED]: [
      ApplicationStatus.REVIEWING,
      ApplicationStatus.SHORTLISTED,
    ],
    [ApplicationStatus.REVIEWING]: [
      ApplicationStatus.SHORTLISTED,
      ApplicationStatus.REJECTED,
    ],
    [ApplicationStatus.SHORTLISTED]: [
      ApplicationStatus.HIRED,
      ApplicationStatus.REJECTED,
    ],
    [ApplicationStatus.REJECTED]: [],
    [ApplicationStatus.HIRED]: [],
  };

@Entity('applications')
export class Application {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Job)
  job!: Job;

  @ManyToOne(() => User)
  applicant!: User;

  @Column('enum', {
    enum: ApplicationStatus,
    default: ApplicationStatus.APPLIED,
  })
  status!: ApplicationStatus;

  @Column('varchar', { nullable: false })
  resumePublicId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
