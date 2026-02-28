import { Test, TestingModule } from '@nestjs/testing';
import { CommentsService } from './comments.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostComment } from './entities/post-comment.entity';
import { Post } from './entities/post.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { GetCommentsQueryDto } from './dto/get-comments-query.dto';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('CommentsService', () => {
  let service: CommentsService;
  let commentsRepository: Repository<PostComment>;
  let postsRepository: Repository<Post>;

  const mockCommentsRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockPostsRepository = {
    findOne: jest.fn(),
    increment: jest.fn(),
    decrement: jest.fn(),
  };

  const mockPost = {
    id: 1,
    title: '테스트 게시글',
    content: '게시글 내용',
    authorId: 'user-uuid-1',
    commentCount: 0,
  };

  const mockComment = {
    id: 1,
    postId: 1,
    authorId: 'user-uuid-1',
    content: '테스트 댓글입니다.',
    parentId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    author: {
      id: 'user-uuid-1',
      username: '댓글작성자',
      nickname: '댓글닉',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        {
          provide: getRepositoryToken(PostComment),
          useValue: mockCommentsRepository,
        },
        {
          provide: getRepositoryToken(Post),
          useValue: mockPostsRepository,
        },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
    commentsRepository = module.get<Repository<PostComment>>(
      getRepositoryToken(PostComment),
    );
    postsRepository = module.get<Repository<Post>>(getRepositoryToken(Post));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create - 댓글 작성', () => {
    const createCommentDto: CreateCommentDto = {
      content: '새 댓글입니다.',
    };
    const authorId = 'user-uuid-1';
    const boardId = 1;

    it('✅ 댓글 생성 성공', async () => {
      mockPostsRepository.findOne.mockResolvedValue(mockPost);
      mockCommentsRepository.create.mockReturnValue({
        ...mockComment,
        content: createCommentDto.content,
      });
      mockCommentsRepository.save.mockResolvedValue({
        ...mockComment,
        content: createCommentDto.content,
      });
      mockPostsRepository.increment.mockResolvedValue(undefined);

      const result = await service.create(boardId, createCommentDto, authorId);

      expect(result.content).toBe(createCommentDto.content);
      expect(commentsRepository.create).toHaveBeenCalledWith({
        ...createCommentDto,
        postId: boardId,
        authorId,
      });
      expect(commentsRepository.save).toHaveBeenCalled();
    });

    it('✅ 게시글의 댓글 수 자동 증가', async () => {
      mockPostsRepository.findOne.mockResolvedValue(mockPost);
      mockCommentsRepository.create.mockReturnValue(mockComment);
      mockCommentsRepository.save.mockResolvedValue(mockComment);
      mockPostsRepository.increment.mockResolvedValue(undefined);

      await service.create(boardId, createCommentDto, authorId);

      expect(postsRepository.increment).toHaveBeenCalledWith(
        { id: boardId },
        'commentCount',
        1,
      );
    });

    it('✅ 대댓글 생성 성공 (parentId 포함)', async () => {
      const replyDto: CreateCommentDto = {
        content: '대댓글입니다.',
        parentId: 1,
      };
      const parentComment = { ...mockComment, id: 1 };

      mockPostsRepository.findOne.mockResolvedValue(mockPost);
      mockCommentsRepository.findOne.mockResolvedValue(parentComment);
      mockCommentsRepository.create.mockReturnValue({
        ...mockComment,
        id: 2,
        content: replyDto.content,
        parentId: 1,
      });
      mockCommentsRepository.save.mockResolvedValue({
        ...mockComment,
        id: 2,
        content: replyDto.content,
        parentId: 1,
      });
      mockPostsRepository.increment.mockResolvedValue(undefined);

      const result = await service.create(boardId, replyDto, authorId);

      expect(result.parentId).toBe(1);
      expect(commentsRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, postId: boardId },
      });
    });

    it('❌ 존재하지 않는 게시글에 댓글 작성 - NotFoundException', async () => {
      mockPostsRepository.findOne.mockResolvedValue(null);

      await expect(service.create(999, createCommentDto, authorId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(999, createCommentDto, authorId)).rejects.toThrow(
        'ID가 999인 게시글을 찾을 수 없습니다.',
      );

      expect(commentsRepository.save).not.toHaveBeenCalled();
      expect(postsRepository.increment).not.toHaveBeenCalled();
    });

    it('❌ 존재하지 않는 부모 댓글에 대댓글 작성 - NotFoundException', async () => {
      const replyDto: CreateCommentDto = {
        content: '대댓글',
        parentId: 999,
      };

      mockPostsRepository.findOne.mockResolvedValue(mockPost);
      mockCommentsRepository.findOne.mockResolvedValue(null);

      await expect(service.create(boardId, replyDto, authorId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(boardId, replyDto, authorId)).rejects.toThrow(
        'ID가 999인 부모 댓글을 찾을 수 없습니다.',
      );
    });

    it('✅ authorId와 postId가 자동으로 설정됨', async () => {
      mockPostsRepository.findOne.mockResolvedValue(mockPost);
      mockCommentsRepository.create.mockReturnValue(mockComment);
      mockCommentsRepository.save.mockResolvedValue(mockComment);
      mockPostsRepository.increment.mockResolvedValue(undefined);

      await service.create(boardId, createCommentDto, authorId);

      expect(commentsRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          postId: boardId,
          authorId,
        }),
      );
    });
  });

  describe('findAll - 댓글 목록 조회', () => {
    const mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
    };

    beforeEach(() => {
      mockCommentsRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    });

    it('✅ 기본 목록 조회 (페이지네이션)', async () => {
      const query: GetCommentsQueryDto = {
        page: 1,
        limit: 20,
      };

      mockPostsRepository.findOne.mockResolvedValue(mockPost);
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockComment], 1]);

      const result = await service.findAll(1, query);

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
      expect(result.meta.totalPages).toBe(1);
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(20);
    });

    it('✅ 2페이지 조회', async () => {
      const query: GetCommentsQueryDto = {
        page: 2,
        limit: 20,
      };

      mockPostsRepository.findOne.mockResolvedValue(mockPost);
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockComment], 25]);

      const result = await service.findAll(1, query);

      expect(result.meta.page).toBe(2);
      expect(result.meta.totalPages).toBe(2);
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(20);
    });

    it('❌ 존재하지 않는 게시글의 댓글 조회 - NotFoundException', async () => {
      mockPostsRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findAll(999, { page: 1, limit: 20 }),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.findAll(999, { page: 1, limit: 20 }),
      ).rejects.toThrow('ID가 999인 게시글을 찾을 수 없습니다.');
    });

    it('✅ 최상위 댓글만 조회 (parentId IS NULL)', async () => {
      const query: GetCommentsQueryDto = { page: 1, limit: 20 };

      mockPostsRepository.findOne.mockResolvedValue(mockPost);
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockComment], 1]);

      await service.findAll(1, query);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'comment.postId = :boardId',
        { boardId: 1 },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'comment.parentId IS NULL',
      );
    });

    it('✅ 오래된 순 정렬 (기본값)', async () => {
      const query: GetCommentsQueryDto = {
        page: 1,
        limit: 20,
        sortBy: 'oldest',
      };

      mockPostsRepository.findOne.mockResolvedValue(mockPost);
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockComment], 1]);

      await service.findAll(1, query);

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'comment.createdAt',
        'ASC',
      );
      expect(mockQueryBuilder.addOrderBy).toHaveBeenCalledWith(
        'children.createdAt',
        'ASC',
      );
    });

    it('✅ 최신순 정렬', async () => {
      const query: GetCommentsQueryDto = {
        page: 1,
        limit: 20,
        sortBy: 'newest',
      };

      mockPostsRepository.findOne.mockResolvedValue(mockPost);
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockComment], 1]);

      await service.findAll(1, query);

      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        'comment.createdAt',
        'DESC',
      );
      expect(mockQueryBuilder.addOrderBy).toHaveBeenCalledWith(
        'children.createdAt',
        'ASC',
      );
    });

    it('✅ 작성자 정보 및 대댓글 포함', async () => {
      const query: GetCommentsQueryDto = { page: 1, limit: 20 };

      mockPostsRepository.findOne.mockResolvedValue(mockPost);
      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockComment], 1]);

      await service.findAll(1, query);

      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'comment.author',
        'author',
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'comment.children',
        'children',
      );
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'children.author',
        'childAuthor',
      );
      expect(mockQueryBuilder.select).toHaveBeenCalledWith(
        expect.arrayContaining([
          'author.role',
          'childAuthor.role',
        ]),
      );
    });
  });

  describe('update - 댓글 수정', () => {
    const updateCommentDto: UpdateCommentDto = {
      content: '수정된 댓글입니다.',
    };

    describe('시나리오 1: 일반 유저 (USER)', () => {
      const currentUserId = 'user-uuid-1';
      const currentUserRole = 'USER';

      it('✅ 본인 댓글 수정 성공', async () => {
        mockCommentsRepository.findOne.mockResolvedValue(mockComment);
        mockCommentsRepository.save.mockResolvedValue({
          ...mockComment,
          ...updateCommentDto,
        });

        const result = await service.update(
          1,
          updateCommentDto,
          currentUserId,
          currentUserRole,
        );

        expect(result.content).toBe('수정된 댓글입니다.');
        expect(commentsRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
        expect(commentsRepository.save).toHaveBeenCalled();
      });

      it('❌ 다른 사람 댓글 수정 불가 - ForbiddenException', async () => {
        const otherUserComment = { ...mockComment, authorId: 'other-user-uuid' };
        mockCommentsRepository.findOne.mockResolvedValue(otherUserComment);

        await expect(
          service.update(1, updateCommentDto, currentUserId, currentUserRole),
        ).rejects.toThrow(ForbiddenException);

        await expect(
          service.update(1, updateCommentDto, currentUserId, currentUserRole),
        ).rejects.toThrow('본인 또는 관리자만 수정할 수 있습니다.');

        expect(commentsRepository.save).not.toHaveBeenCalled();
      });
    });

    describe('시나리오 2: 관리자 (ADMIN)', () => {
      const adminUserId = 'admin-uuid';
      const adminRole = 'ADMIN';

      it('✅ 모든 댓글 수정 가능', async () => {
        mockCommentsRepository.findOne.mockResolvedValue(mockComment);
        mockCommentsRepository.save.mockResolvedValue({
          ...mockComment,
          ...updateCommentDto,
        });

        const result = await service.update(
          1,
          updateCommentDto,
          adminUserId,
          adminRole,
        );

        expect(result.content).toBe('수정된 댓글입니다.');
        expect(commentsRepository.save).toHaveBeenCalled();
      });

      it('✅ 다른 유저의 댓글도 수정 가능', async () => {
        mockCommentsRepository.findOne.mockResolvedValue(mockComment);
        mockCommentsRepository.save.mockResolvedValue({
          ...mockComment,
          ...updateCommentDto,
        });

        await service.update(1, updateCommentDto, adminUserId, adminRole);

        expect(commentsRepository.save).toHaveBeenCalled();
      });
    });

    it('❌ 존재하지 않는 댓글 수정 - NotFoundException', async () => {
      mockCommentsRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(999, updateCommentDto, 'user-uuid-1', 'USER'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.update(999, updateCommentDto, 'user-uuid-1', 'USER'),
      ).rejects.toThrow('ID가 999인 댓글을 찾을 수 없습니다.');
    });

    it('✅ 부분 수정 (내용만)', async () => {
      const partialUpdate: UpdateCommentDto = { content: '내용만 수정' };
      mockCommentsRepository.findOne.mockResolvedValue(mockComment);
      mockCommentsRepository.save.mockResolvedValue({
        ...mockComment,
        content: '내용만 수정',
      });

      const result = await service.update(
        1,
        partialUpdate,
        'user-uuid-1',
        'USER',
      );

      expect(result.content).toBe('내용만 수정');
      expect(result.postId).toBe(mockComment.postId);
    });
  });

  describe('remove - 댓글 삭제', () => {
    describe('시나리오 1: 일반 유저 (USER)', () => {
      const currentUserId = 'user-uuid-1';
      const currentUserRole = 'USER';

      it('✅ 본인 댓글 삭제 성공', async () => {
        mockCommentsRepository.findOne.mockResolvedValue(mockComment);
        mockCommentsRepository.delete.mockResolvedValue({ affected: 1 });
        mockPostsRepository.decrement.mockResolvedValue(undefined);

        await service.remove(1, currentUserId, currentUserRole);

        expect(commentsRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
        expect(commentsRepository.delete).toHaveBeenCalledWith(1);
      });

      it('✅ 게시글의 댓글 수 자동 감소', async () => {
        mockCommentsRepository.findOne.mockResolvedValue(mockComment);
        mockCommentsRepository.delete.mockResolvedValue({ affected: 1 });
        mockPostsRepository.decrement.mockResolvedValue(undefined);

        await service.remove(1, currentUserId, currentUserRole);

        expect(postsRepository.decrement).toHaveBeenCalledWith(
          { id: mockComment.postId },
          'commentCount',
          1,
        );
      });

      it('❌ 다른 사람 댓글 삭제 불가 - ForbiddenException', async () => {
        const otherUserComment = { ...mockComment, authorId: 'other-user-uuid' };
        mockCommentsRepository.findOne.mockResolvedValue(otherUserComment);

        await expect(
          service.remove(1, currentUserId, currentUserRole),
        ).rejects.toThrow(ForbiddenException);

        await expect(
          service.remove(1, currentUserId, currentUserRole),
        ).rejects.toThrow('본인 또는 관리자만 삭제할 수 있습니다.');

        expect(commentsRepository.delete).not.toHaveBeenCalled();
        expect(postsRepository.decrement).not.toHaveBeenCalled();
      });
    });

    describe('시나리오 2: 관리자 (ADMIN)', () => {
      const adminUserId = 'admin-uuid';
      const adminRole = 'ADMIN';

      it('✅ 모든 댓글 삭제 가능', async () => {
        mockCommentsRepository.findOne.mockResolvedValue(mockComment);
        mockCommentsRepository.delete.mockResolvedValue({ affected: 1 });
        mockPostsRepository.decrement.mockResolvedValue(undefined);

        await service.remove(1, adminUserId, adminRole);

        expect(commentsRepository.delete).toHaveBeenCalledWith(1);
        expect(postsRepository.decrement).toHaveBeenCalled();
      });

      it('✅ 다른 유저의 댓글도 삭제 가능', async () => {
        mockCommentsRepository.findOne.mockResolvedValue(mockComment);
        mockCommentsRepository.delete.mockResolvedValue({ affected: 1 });
        mockPostsRepository.decrement.mockResolvedValue(undefined);

        await service.remove(1, adminUserId, adminRole);

        expect(commentsRepository.delete).toHaveBeenCalledWith(1);
      });
    });

    it('❌ 존재하지 않는 댓글 삭제 - NotFoundException', async () => {
      mockCommentsRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999, 'user-uuid-1', 'USER')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.remove(999, 'user-uuid-1', 'USER')).rejects.toThrow(
        'ID가 999인 댓글을 찾을 수 없습니다.',
      );
    });

    it('✅ 삭제는 반환값이 없어야 함 (void)', async () => {
      mockCommentsRepository.findOne.mockResolvedValue(mockComment);
      mockCommentsRepository.delete.mockResolvedValue({ affected: 1 });
      mockPostsRepository.decrement.mockResolvedValue(undefined);

      const result = await service.remove(1, 'user-uuid-1', 'USER');

      expect(result).toBeUndefined();
    });
  });

  describe('권한 통합 테스트', () => {
    const updateDto: UpdateCommentDto = { content: '수정됨' };

    describe('USER 역할의 모든 제약사항', () => {
      it('본인만 수정/삭제 가능, 다른 유저는 불가', async () => {
        // 본인 댓글 수정 성공
        mockCommentsRepository.findOne.mockResolvedValueOnce(mockComment);
        mockCommentsRepository.save.mockResolvedValueOnce({
          ...mockComment,
          content: '수정됨',
        });
        const updated = await service.update(1, updateDto, 'user-uuid-1', 'USER');
        expect(updated.content).toBe('수정됨');

        // 다른 유저 댓글 수정 실패
        const otherUserComment = { ...mockComment, authorId: 'other-user-uuid' };
        mockCommentsRepository.findOne.mockResolvedValueOnce(otherUserComment);
        await expect(
          service.update(1, updateDto, 'user-uuid-1', 'USER'),
        ).rejects.toThrow(ForbiddenException);

        // 본인 댓글 삭제 성공
        mockCommentsRepository.findOne.mockResolvedValueOnce(mockComment);
        mockCommentsRepository.delete.mockResolvedValueOnce({ affected: 1 });
        mockPostsRepository.decrement.mockResolvedValueOnce(undefined);
        await expect(
          service.remove(1, 'user-uuid-1', 'USER'),
        ).resolves.toBeUndefined();

        // 다른 유저 댓글 삭제 실패
        mockCommentsRepository.findOne.mockResolvedValueOnce(otherUserComment);
        await expect(
          service.remove(1, 'user-uuid-1', 'USER'),
        ).rejects.toThrow(ForbiddenException);
      });
    });

    describe('ADMIN 역할의 모든 권한', () => {
      it('모든 댓글 조회, 수정, 삭제 가능', async () => {
        const mockQueryBuilder = {
          leftJoinAndSelect: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          addOrderBy: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          take: jest.fn().mockReturnThis(),
          getManyAndCount: jest.fn().mockResolvedValue([[mockComment], 1]),
        };

        // 댓글 조회
        mockPostsRepository.findOne.mockResolvedValue(mockPost);
        mockCommentsRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
        const comments = await service.findAll(1, { page: 1, limit: 20 });
        expect(comments.data).toHaveLength(1);

        // 다른 유저 댓글 수정
        mockCommentsRepository.findOne.mockResolvedValueOnce(mockComment);
        mockCommentsRepository.save.mockResolvedValueOnce({
          ...mockComment,
          content: 'ADMIN 수정',
        });
        const updated = await service.update(
          1,
          { content: 'ADMIN 수정' },
          'admin-uuid',
          'ADMIN',
        );
        expect(updated.content).toBe('ADMIN 수정');

        // 다른 유저 댓글 삭제
        mockCommentsRepository.findOne.mockResolvedValueOnce(mockComment);
        mockCommentsRepository.delete.mockResolvedValueOnce({ affected: 1 });
        mockPostsRepository.decrement.mockResolvedValueOnce(undefined);
        await expect(
          service.remove(1, 'admin-uuid', 'ADMIN'),
        ).resolves.toBeUndefined();
      });
    });
  });

  describe('대댓글 기능', () => {
    it('✅ 대댓글 작성 시 부모 댓글 검증', async () => {
      const replyDto: CreateCommentDto = {
        content: '대댓글',
        parentId: 1,
      };
      const parentComment = { ...mockComment, id: 1 };

      mockPostsRepository.findOne.mockResolvedValue(mockPost);
      mockCommentsRepository.findOne.mockResolvedValue(parentComment);
      mockCommentsRepository.create.mockReturnValue({
        ...mockComment,
        id: 2,
        parentId: 1,
      });
      mockCommentsRepository.save.mockResolvedValue({
        ...mockComment,
        id: 2,
        parentId: 1,
      });
      mockPostsRepository.increment.mockResolvedValue(undefined);

      await service.create(1, replyDto, 'user-uuid-1');

      expect(commentsRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1, postId: 1 },
      });
    });

    it('❌ 다른 게시글의 댓글을 부모로 지정 불가', async () => {
      const replyDto: CreateCommentDto = {
        content: '대댓글',
        parentId: 1,
      };

      mockPostsRepository.findOne.mockResolvedValue(mockPost);
      mockCommentsRepository.findOne.mockResolvedValue(null); // 다른 게시글의 댓글

      await expect(service.create(1, replyDto, 'user-uuid-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
