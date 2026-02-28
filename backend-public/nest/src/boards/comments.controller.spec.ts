import { Test, TestingModule } from '@nestjs/testing';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { GetCommentsQueryDto } from './dto/get-comments-query.dto';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('CommentsController', () => {
  let controller: CommentsController;
  let service: CommentsService;

  const mockCommentsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
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

  const mockUser = {
    userId: 'user-uuid-1',
    username: '테스터',
    role: 'USER',
  };

  const mockAdmin = {
    userId: 'admin-uuid',
    username: '관리자',
    role: 'ADMIN',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommentsController],
      providers: [
        {
          provide: CommentsService,
          useValue: mockCommentsService,
        },
      ],
    }).compile();

    controller = module.get<CommentsController>(CommentsController);
    service = module.get<CommentsService>(CommentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create - 댓글 작성', () => {
    const createCommentDto: CreateCommentDto = {
      content: '새 댓글입니다.',
    };

    it('✅ USER - 댓글 작성 성공', async () => {
      mockCommentsService.create.mockResolvedValue({
        ...mockComment,
        content: createCommentDto.content,
      });

      const result = await controller.create(1, createCommentDto, mockUser);

      expect(result.content).toBe(createCommentDto.content);
      expect(service.create).toHaveBeenCalledWith(
        1,
        createCommentDto,
        mockUser.userId,
      );
      expect(service.create).toHaveBeenCalledTimes(1);
    });

    it('✅ ADMIN - 댓글 작성 성공', async () => {
      mockCommentsService.create.mockResolvedValue({
        ...mockComment,
        authorId: mockAdmin.userId,
      });

      const result = await controller.create(1, createCommentDto, mockAdmin);

      expect(result.authorId).toBe(mockAdmin.userId);
      expect(service.create).toHaveBeenCalledWith(
        1,
        createCommentDto,
        mockAdmin.userId,
      );
    });

    it('✅ 대댓글 작성 (parentId 포함)', async () => {
      const replyDto: CreateCommentDto = {
        content: '대댓글입니다.',
        parentId: 1,
      };

      mockCommentsService.create.mockResolvedValue({
        ...mockComment,
        id: 2,
        content: replyDto.content,
        parentId: 1,
      });

      const result = await controller.create(1, replyDto, mockUser);

      expect(result.parentId).toBe(1);
      expect(result.content).toBe(replyDto.content);
    });

    it('❌ 존재하지 않는 게시글에 댓글 작성 - NotFoundException', async () => {
      mockCommentsService.create.mockRejectedValue(
        new NotFoundException('ID가 999인 게시글을 찾을 수 없습니다.'),
      );

      await expect(controller.create(999, createCommentDto, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('❌ 존재하지 않는 부모 댓글에 대댓글 작성 - NotFoundException', async () => {
      const replyDto: CreateCommentDto = {
        content: '대댓글',
        parentId: 999,
      };

      mockCommentsService.create.mockRejectedValue(
        new NotFoundException('ID가 999인 부모 댓글을 찾을 수 없습니다.'),
      );

      await expect(controller.create(1, replyDto, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll - 댓글 목록 조회', () => {
    const mockCommentsResponse = {
      data: [mockComment],
      meta: {
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      },
    };

    it('✅ 기본 목록 조회 (비로그인 사용자 포함)', async () => {
      const query: GetCommentsQueryDto = {
        page: 1,
        limit: 20,
      };

      mockCommentsService.findAll.mockResolvedValue(mockCommentsResponse);

      const result = await controller.findAll(1, query);

      expect(result.data).toHaveLength(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
      expect(service.findAll).toHaveBeenCalledWith(1, query);
    });

    it('✅ 오래된 순 정렬 (기본값)', async () => {
      const query: GetCommentsQueryDto = {
        page: 1,
        limit: 20,
        sortBy: 'oldest',
      };

      mockCommentsService.findAll.mockResolvedValue(mockCommentsResponse);

      await controller.findAll(1, query);

      expect(service.findAll).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ sortBy: 'oldest' }),
      );
    });

    it('✅ 최신순 정렬', async () => {
      const query: GetCommentsQueryDto = {
        page: 1,
        limit: 20,
        sortBy: 'newest',
      };

      mockCommentsService.findAll.mockResolvedValue(mockCommentsResponse);

      await controller.findAll(1, query);

      expect(service.findAll).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ sortBy: 'newest' }),
      );
    });

    it('✅ 2페이지 조회', async () => {
      const query: GetCommentsQueryDto = {
        page: 2,
        limit: 10,
      };

      mockCommentsService.findAll.mockResolvedValue({
        ...mockCommentsResponse,
        meta: { total: 25, page: 2, limit: 10, totalPages: 3 },
      });

      const result = await controller.findAll(1, query);

      expect(result.meta.page).toBe(2);
      expect(result.meta.totalPages).toBe(3);
    });

    it('❌ 존재하지 않는 게시글의 댓글 조회 - NotFoundException', async () => {
      mockCommentsService.findAll.mockRejectedValue(
        new NotFoundException('ID가 999인 게시글을 찾을 수 없습니다.'),
      );

      await expect(
        controller.findAll(999, { page: 1, limit: 20 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('✅ 댓글에 작성자 정보 포함', async () => {
      mockCommentsService.findAll.mockResolvedValue(mockCommentsResponse);

      const result = await controller.findAll(1, { page: 1, limit: 20 });

      expect(result.data[0].author).toBeDefined();
      expect(result.data[0].author.username).toBe('댓글작성자');
      expect(result.data[0].author.nickname).toBe('댓글닉');
    });
  });

  describe('update - 댓글 수정', () => {
    const updateCommentDto: UpdateCommentDto = {
      content: '수정된 댓글입니다.',
    };

    it('✅ USER - 본인 댓글 수정 성공', async () => {
      mockCommentsService.update.mockResolvedValue({
        ...mockComment,
        content: updateCommentDto.content,
      });

      const result = await controller.update(1, updateCommentDto, mockUser);

      expect(result.content).toBe('수정된 댓글입니다.');
      expect(service.update).toHaveBeenCalledWith(
        1,
        updateCommentDto,
        mockUser.userId,
        mockUser.role,
      );
    });

    it('❌ USER - 다른 사람 댓글 수정 불가 - ForbiddenException', async () => {
      mockCommentsService.update.mockRejectedValue(
        new ForbiddenException('본인 또는 관리자만 수정할 수 있습니다.'),
      );

      await expect(controller.update(1, updateCommentDto, mockUser)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(controller.update(1, updateCommentDto, mockUser)).rejects.toThrow(
        '본인 또는 관리자만 수정할 수 있습니다.',
      );
    });

    it('✅ ADMIN - 모든 댓글 수정 가능', async () => {
      mockCommentsService.update.mockResolvedValue({
        ...mockComment,
        content: updateCommentDto.content,
      });

      const result = await controller.update(1, updateCommentDto, mockAdmin);

      expect(result.content).toBe('수정된 댓글입니다.');
      expect(service.update).toHaveBeenCalledWith(
        1,
        updateCommentDto,
        mockAdmin.userId,
        mockAdmin.role,
      );
    });

    it('❌ 존재하지 않는 댓글 수정 - NotFoundException', async () => {
      mockCommentsService.update.mockRejectedValue(
        new NotFoundException('ID가 999인 댓글을 찾을 수 없습니다.'),
      );

      await expect(controller.update(999, updateCommentDto, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('✅ 댓글 내용만 수정 가능 (부분 수정)', async () => {
      mockCommentsService.update.mockResolvedValue({
        ...mockComment,
        content: '내용만 수정',
      });

      const result = await controller.update(1, { content: '내용만 수정' }, mockUser);

      expect(result.content).toBe('내용만 수정');
      expect(result.postId).toBe(mockComment.postId); // 다른 필드는 변경 안됨
    });
  });

  describe('remove - 댓글 삭제', () => {
    it('✅ USER - 본인 댓글 삭제 성공', async () => {
      mockCommentsService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(1, mockUser);

      expect(result).toBeUndefined();
      expect(service.remove).toHaveBeenCalledWith(1, mockUser.userId, mockUser.role);
    });

    it('❌ USER - 다른 사람 댓글 삭제 불가 - ForbiddenException', async () => {
      mockCommentsService.remove.mockRejectedValue(
        new ForbiddenException('본인 또는 관리자만 삭제할 수 있습니다.'),
      );

      await expect(controller.remove(1, mockUser)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(controller.remove(1, mockUser)).rejects.toThrow(
        '본인 또는 관리자만 삭제할 수 있습니다.',
      );
    });

    it('✅ ADMIN - 모든 댓글 삭제 가능', async () => {
      mockCommentsService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(1, mockAdmin);

      expect(result).toBeUndefined();
      expect(service.remove).toHaveBeenCalledWith(
        1,
        mockAdmin.userId,
        mockAdmin.role,
      );
    });

    it('❌ 존재하지 않는 댓글 삭제 - NotFoundException', async () => {
      mockCommentsService.remove.mockRejectedValue(
        new NotFoundException('ID가 999인 댓글을 찾을 수 없습니다.'),
      );

      await expect(controller.remove(999, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('✅ 삭제는 반환값이 없어야 함 (void)', async () => {
      mockCommentsService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(1, mockUser);

      expect(result).toBeUndefined();
    });
  });

  describe('권한 통합 테스트', () => {
    it('👤 USER는 본인 댓글만 수정/삭제 가능', async () => {
      const createDto: CreateCommentDto = {
        content: '내 댓글',
      };

      // 생성
      mockCommentsService.create.mockResolvedValue(mockComment);
      const created = await controller.create(1, createDto, mockUser);
      expect(created.authorId).toBe(mockUser.userId);

      // 본인 댓글 수정 성공
      const updateDto: UpdateCommentDto = { content: '수정됨' };
      mockCommentsService.update.mockResolvedValue({
        ...mockComment,
        content: '수정됨',
      });
      const updated = await controller.update(1, updateDto, mockUser);
      expect(updated.content).toBe('수정됨');

      // 본인 댓글 삭제 성공
      mockCommentsService.remove.mockResolvedValue(undefined);
      await expect(controller.remove(1, mockUser)).resolves.toBeUndefined();
    });

    it('👮 ADMIN은 모든 댓글 수정/삭제 가능', async () => {
      // 다른 사람 댓글 수정
      const updateDto: UpdateCommentDto = { content: 'ADMIN 수정' };
      mockCommentsService.update.mockResolvedValue({
        ...mockComment,
        content: 'ADMIN 수정',
      });
      const updated = await controller.update(1, updateDto, mockAdmin);
      expect(updated.content).toBe('ADMIN 수정');

      // 다른 사람 댓글 삭제
      mockCommentsService.remove.mockResolvedValue(undefined);
      await expect(controller.remove(1, mockAdmin)).resolves.toBeUndefined();
    });

    it('🔒 USER가 다른 사람 댓글 수정 시 ForbiddenException', async () => {
      const updateDto: UpdateCommentDto = { content: '해킹 시도' };
      mockCommentsService.update.mockRejectedValue(
        new ForbiddenException('본인 또는 관리자만 수정할 수 있습니다.'),
      );

      await expect(controller.update(1, updateDto, mockUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('🔒 USER가 다른 사람 댓글 삭제 시 ForbiddenException', async () => {
      mockCommentsService.remove.mockRejectedValue(
        new ForbiddenException('본인 또는 관리자만 삭제할 수 있습니다.'),
      );

      await expect(controller.remove(1, mockUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('📖 비로그인 사용자도 댓글 조회 가능', async () => {
      const mockResponse = {
        data: [mockComment],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      };
      mockCommentsService.findAll.mockResolvedValue(mockResponse);

      const result = await controller.findAll(1, { page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(service.findAll).toHaveBeenCalledWith(1, { page: 1, limit: 20 });
    });
  });

  describe('대댓글 기능', () => {
    it('✅ 대댓글 작성 성공', async () => {
      const replyDto: CreateCommentDto = {
        content: '대댓글입니다.',
        parentId: 1,
      };

      const mockReply = {
        ...mockComment,
        id: 2,
        content: replyDto.content,
        parentId: 1,
      };

      mockCommentsService.create.mockResolvedValue(mockReply);

      const result = await controller.create(1, replyDto, mockUser);

      expect(result.parentId).toBe(1);
      expect(result.id).toBe(2);
    });

    it('✅ 댓글 조회 시 대댓글 포함', async () => {
      const commentWithReplies = {
        ...mockComment,
        children: [
          {
            id: 2,
            content: '대댓글1',
            parentId: 1,
            author: { username: '대댓글작성자' },
          },
        ],
      };

      mockCommentsService.findAll.mockResolvedValue({
        data: [commentWithReplies],
        meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
      });

      const result = await controller.findAll(1, { page: 1, limit: 20 });

      expect(result.data[0].children).toBeDefined();
      expect(result.data[0].children).toHaveLength(1);
    });
  });
});
