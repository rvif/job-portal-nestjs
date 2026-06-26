import { Organization } from 'src/organization/entities/organization.entity';
import { User } from 'src/users/users.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum EmploymentType {
  FULL_TIME = 'full_time',
  PART_TIME = 'part_time',
  INTERNSHIP = 'internship',
  CONTRACT = 'contract',
}

export enum ExperienceLevel {
  FRESHER = 'fresher',
  MID = 'mid',
  SENIOR = 'senior',
}

@Entity('jobs')
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('varchar', { length: 50, nullable: false })
  title!: string;

  @ManyToOne(() => Organization, (org) => org.jobs, { onDelete: 'CASCADE' })
  organization!: Organization;

  @Column('text', { nullable: false })
  description!: string;

  @Column('varchar', { length: 100, nullable: false })
  location!: string;

  @Column('boolean', { nullable: false, default: false })
  isRemote!: boolean;

  @Column('integer', { nullable: false })
  salaryMin!: number;

  @Column('integer', { nullable: false })
  salaryMax!: number;

  @Column('enum', { enum: EmploymentType, nullable: false })
  employmentType!: EmploymentType;

  @Column('enum', { enum: ExperienceLevel, nullable: false })
  experienceLevel!: ExperienceLevel;

  // for soft deletion of jobs
  @Column('boolean', { nullable: false, default: true, select: false })
  isActive!: boolean;

  @ManyToOne(() => User)
  createdBy!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
