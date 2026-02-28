import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Post } from './post.entity';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'post_rating' })
export class PostRating {
  @PrimaryGeneratedColumn({ comment: 'PK' })
  id!: number;

  @Column({ name: 'user_id', type: 'uuid', comment: 'FK | user.id' })
  userId!: string;

  @Column({ name: 'post_id', type: 'int', comment: 'FK | post.id' })
  postId!: number;

  @Column({ type: 'smallint', comment: '1~5 정수' })
  score!: number;

  @Column({ type: 'text', nullable: true, comment: '별점 코멘트' })
  comment?: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
    comment: '평가 시각',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
    comment: '수정 시각',
  })
  updatedAt!: Date;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Post, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post!: Post;
}
