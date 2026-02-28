import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostComment } from './entities/post-comment.entity';
import { Post } from './entities/post.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { GetCommentsQueryDto } from './dto/get-comments-query.dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(PostComment)
    private readonly commentsRepository: Repository<PostComment>,
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
  ) { }

  async create(boardId: number, createCommentDto: CreateCommentDto, authorId: string) {
    // 게시글 존재 확인
    const post = await this.postsRepository.findOne({ where: { id: boardId } });
    if (!post) {
      throw new NotFoundException(`ID가 ${boardId}인 게시글을 찾을 수 없습니다.`);
    }

    // 부모 댓글이 있는 경우 (대댓글) 존재 확인
    if (createCommentDto.parentId) {
      const parentComment = await this.commentsRepository.findOne({
        where: { id: createCommentDto.parentId, postId: boardId },
      });
      if (!parentComment) {
        throw new NotFoundException(
          `ID가 ${createCommentDto.parentId}인 부모 댓글을 찾을 수 없습니다.`,
        );
      }
    }

    const comment = this.commentsRepository.create({
      ...createCommentDto,
      postId: boardId,
      authorId,
    });

    const savedComment = await this.commentsRepository.save(comment);

    // 게시글의 댓글 수 증가
    await this.postsRepository.increment({ id: boardId }, 'commentCount', 1);

    return savedComment;
  }

  async findAll(boardId: number, query: GetCommentsQueryDto) {
    const { page = 1, limit = 20, sortBy = 'oldest' } = query;

    // 게시글 존재 확인
    const post = await this.postsRepository.findOne({ where: { id: boardId } });
    if (!post) {
      throw new NotFoundException(`ID가 ${boardId}인 게시글을 찾을 수 없습니다.`);
    }

    const queryBuilder = this.commentsRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.author', 'author')
      .leftJoinAndSelect('comment.children', 'children')
      .leftJoinAndSelect('children.author', 'childAuthor')
      .select([
        'comment.id',
        'comment.content',
        'comment.parentId',
        'comment.createdAt',
        'comment.updatedAt',
        'author.id',
        'author.username',
        'author.nickname',
        'author.role',
        'children.id',
        'children.content',
        'children.createdAt',
        'children.updatedAt',
        'childAuthor.id',
        'childAuthor.username',
        'childAuthor.nickname',
        'childAuthor.role',
      ])
      .where('comment.postId = :boardId', { boardId })
      .andWhere('comment.parentId IS NULL'); // 최상위 댓글만

    // 정렬
    switch (sortBy) {
      case 'newest':
        queryBuilder.orderBy('comment.createdAt', 'DESC');
        queryBuilder.addOrderBy('children.createdAt', 'ASC');
        break;
      case 'oldest':
      default:
        queryBuilder.orderBy('comment.createdAt', 'ASC');
        queryBuilder.addOrderBy('children.createdAt', 'ASC');
        break;
    }

    // 페이지네이션
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [comments, total] = await queryBuilder.getManyAndCount();

    return {
      data: comments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async update(
    id: number,
    updateCommentDto: UpdateCommentDto,
    currentUserId: string,
    currentUserRole: string,
  ) {
    const comment = await this.commentsRepository.findOne({ where: { id } });
    if (!comment) {
      throw new NotFoundException(`ID가 ${id}인 댓글을 찾을 수 없습니다.`);
    }

    // 권한 확인: 본인 또는 ADMIN만 수정 가능
    if (comment.authorId !== currentUserId && currentUserRole !== 'ADMIN') {
      throw new ForbiddenException('본인 또는 관리자만 수정할 수 있습니다.');
    }

    Object.assign(comment, updateCommentDto);
    return this.commentsRepository.save(comment);
  }

  async remove(id: number, currentUserId: string, currentUserRole: string) {
    const comment = await this.commentsRepository.findOne({ where: { id } });
    if (!comment) {
      throw new NotFoundException(`ID가 ${id}인 댓글을 찾을 수 없습니다.`);
    }

    // 권한 확인: 본인 또는 ADMIN만 삭제 가능
    if (comment.authorId !== currentUserId && currentUserRole !== 'ADMIN') {
      throw new ForbiddenException('본인 또는 관리자만 삭제할 수 있습니다.');
    }

    const postId = comment.postId;

    // 댓글 삭제
    await this.commentsRepository.delete(id);

    // 게시글의 댓글 수 감소
    await this.postsRepository.decrement({ id: postId }, 'commentCount', 1);
  }
}
