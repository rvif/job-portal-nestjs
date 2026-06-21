import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrganizationMember } from './organization-members.entity';

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  name!: string;

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

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
