import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('post')
export class Post {
  @PrimaryGeneratedColumn({ comment: 'PK (SERIAL)' })
  id!: number;

  @Column({ name: 'author_id', type: 'uuid', comment: 'FK | 작성자의 user.id' })
  authorId!: string;

  @Column({ type: 'varchar', length: 200, comment: '제목' })
  title!: string;

  @Column({ type: 'text', comment: '본문(Markdown)' })
  content!: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'General',
    comment: 'Category/Prefix (Notice/Recipe etc)',
  })
  prefix!: string;

  @Column({
    name: 'is_pinned',
    type: 'boolean',
    default: false,
    comment: '상단 고정',
  })
  isPinned!: boolean;

  @Column({ type: 'int', default: 0, comment: '조회수' })
  views!: number;

  @Column({
    name: 'comment_count',
    type: 'int',
    default: 0,
    comment: '댓글 수 캐시',
  })
  commentCount!: number;

  @Column({
    name: 'average_rating',
    type: 'decimal',
    precision: 2,
    scale: 1,
    default: 0,
    comment: '별점 평균(1~5)',
  })
  averageRating!: number;

  @Column({
    name: 'rating_count',
    type: 'int',
    default: 0,
    comment: '별점 참여 수',
  })
  ratingCount!: number;

  @Column({
    name: 'img_url',
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: '이미지 경로',
  })
  img_url?: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
    comment: '작성 시각',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
    comment: '수정 시각',
  })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'author_id' })
  author!: User;
}
