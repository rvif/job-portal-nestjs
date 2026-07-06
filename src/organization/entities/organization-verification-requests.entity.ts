import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Organization } from './organization.entity';

export enum VerificationStatus {
  PENDING = 'pending',
  REJECTED = 'rejected',
  VERIFIED = 'verified',
}

@Entity('organization_verification_requests')
export class OrganizationVerificationRequest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => Organization, (organization) => organization.verifyRequest, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  organization!: Organization;

  @Column({ enum: VerificationStatus, nullable: true })
  status?: VerificationStatus;

  @Column('varchar')
  domain!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
