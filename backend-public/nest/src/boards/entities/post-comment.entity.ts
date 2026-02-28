import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Post } from './post.entity';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'post_comment' })
export class PostComment {
  @PrimaryGeneratedColumn({ comment: 'PK' })
  id!: number;

  @Column({ name: 'post_id', type: 'int', comment: 'FK | post.id' })
  postId!: number;

  @Column({ name: 'author_id', type: 'uuid', comment: 'FK | user.id' })
  authorId!: string;

  @Column({ type: 'text', comment: '댓글 내용' })
  content!: string;

  @Column({
    name: 'parent_id',
    type: 'int',
    nullable: true,
    comment: '부모 댓글(대댓글)',
  })
  parentId?: number;

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

  @ManyToOne(() => Post, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post!: Post;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'author_id' })
  author!: User;

  @ManyToOne(() => PostComment, (comment) => comment.children, {
    nullable: true,
    onDelete: 'SET NULL',
  })

  @JoinColumn({ name: 'parent_id' })
  parent?: PostComment;

  @OneToMany(() => PostComment, (comment) => comment.parent)
  children?: PostComment[];
}
