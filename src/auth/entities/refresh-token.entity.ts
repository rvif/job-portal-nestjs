import { User } from 'src/users/users.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, (user) => user.refreshTokens, { onDelete: 'CASCADE' })
  user!: User;

  @Column('text', { nullable: false })
  hashedToken!: string;

  @Column('timestamp', { nullable: false })
  expiresAt!: Date;

  // null = active, timestamp = revoked
  @Column('timestamp', { nullable: true })
  revokedAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;
}
