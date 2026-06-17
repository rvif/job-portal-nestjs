import { User } from 'src/users/users.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum OtpType {
  EMAIL_VERIFICATION = 'email_verification',
  PASSWORD_RESET = 'password_reset',
}

@Entity('otps')
export class Otp {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, (user) => user.otps, { onDelete: 'CASCADE' })
  user!: User;

  @Column('enum', { enum: OtpType })
  type!: OtpType;

  @Column('text', { nullable: false })
  otpHash!: string;

  @Column('timestamp', { nullable: false })
  expiresAt!: Date;

  @Column('timestamp', { nullable: true })
  usedAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;
}
