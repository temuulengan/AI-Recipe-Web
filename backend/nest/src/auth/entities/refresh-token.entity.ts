import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'refresh_token' })
export class RefreshToken {
  @PrimaryGeneratedColumn({ comment: 'PK' })
  id!: number;

  @Column({ name: 'user_id', type: 'uuid', comment: 'FK | user.id' })
  userId!: string;

  @Column({ type: 'text', comment: 'refresh token (JWT)' })
  token!: string;

  @Column({ name: 'expires_at', type: 'timestamptz', comment: '만료 시각' })
  expiresAt!: Date;

  @Column({ name: 'is_revoked', type: 'boolean', default: false, comment: '폐기 여부' })
  isRevoked!: boolean;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
    comment: '생성 시각',
  })
  createdAt!: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
