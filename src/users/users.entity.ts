import { Otp } from 'src/auth/entities/email-verification-otp.entity';
import { RefreshToken } from 'src/auth/entities/refresh-token.entity';
import { OrganizationMember } from 'src/organization/entities/organization-members.entity';

import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UserRole {
  CANDIDATE = 'candidate',
  RECRUITER = 'recruiter',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('varchar', { length: 24, nullable: true, unique: true })
  username?: string;

  @Column('enum', {
    enum: UserRole,
    nullable: false,
    default: UserRole.CANDIDATE,
  })
  role!: UserRole;

  @Column('varchar', { length: 50, nullable: true })
  firstName?: string;

  @Column('varchar', { length: 50, nullable: true })
  lastName?: string;

  @Column({ nullable: true, unique: true })
  googleId?: string;

  @Column({ nullable: false, unique: true })
  email!: string;

  @Column({ nullable: true, select: false })
  hashedPassword?: string;

  @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user)
  refreshTokens?: RefreshToken[];

  @OneToMany(() => Otp, (otp) => otp.user)
  otps?: Otp[];

  @Column('text', { nullable: true })
  avatarUrl?: string;

  @Column('text', { nullable: true })
  bio?: string;

  @Column({ length: 20, nullable: true })
  phoneNumber?: string;

  @Column({ default: false })
  emailVerified!: boolean;

  @Column({ nullable: true })
  location?: string;

  @OneToMany(() => OrganizationMember, (membership) => membership.user)
  organizationMemberships?: OrganizationMember[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
