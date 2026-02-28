import { Test, TestingModule } from '@nestjs/testing';
import { BoardsController } from './boards.controller';
import { BoardsService } from './boards.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { GetPostsQueryDto } from './dto/get-posts-query.dto';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('BoardsController', () => {
  let controller: BoardsController;
  let service: BoardsService;

  const mockBoardsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockPost = {
    id: 1,
    authorId: 'user-uuid-1',
    title: '테스트 게시글',
    content: '테스트 내용입니다.',
    prefix: 'General',
    isPinned: false,
    views: 0,
    commentCount: 0,
    averageRating: 0,
    ratingCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    author: {
      id: 'user-uuid-1',
      username: '테스터',
      nickname: '테스트닉',
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
      controllers: [BoardsController],
      providers: [
        {
          provide: BoardsService,
          useValue: mockBoardsService,
        },
      ],
    }).compile();

    controller = module.get<BoardsController>(BoardsController);
    service = module.get<BoardsService>(BoardsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create - 게시글 작성', () => {
    const createPostDto: CreatePostDto = {
      title: '새 게시글',
      content: '게시글 내용',
      prefix: 'General',
    };

    it('✅ USER - 게시글 작성 성공', async () => {
      mockBoardsService.create.mockResolvedValue({
        ...mockPost,
        title: createPostDto.title,
        content: createPostDto.content,
      });

      const result = await controller.create(createPostDto, undefined, mockUser);

      expect(result.title).toBe(createPostDto.title);
      expect(service.create).toHaveBeenCalledWith(createPostDto, mockUser.userId, undefined);
      expect(service.create).toHaveBeenCalledTimes(1);
    });

    it('✅ ADMIN - 게시글 작성 성공', async () => {
      mockBoardsService.create.mockResolvedValue({
        ...mockPost,
        authorId: mockAdmin.userId,
      });

      const result = await controller.create(createPostDto, undefined, mockAdmin);

      expect(result.authorId).toBe(mockAdmin.userId);
      expect(service.create).toHaveBeenCalledWith(createPostDto, mockAdmin.userId, undefined);
    });

    it('✅ 말머리가 있는 게시글 작성', async () => {
      const recipePost: CreatePostDto = {
        title: '맛있는 레시피',
        content: '레시피 내용',
        prefix: 'Recipe',
      };

      mockBoardsService.create.mockResolvedValue({
        ...mockPost,
        ...recipePost,
      });

      const result = await controller.create(recipePost, undefined, mockUser);

      expect(result.prefix).toBe('Recipe');
      expect(service.create).toHaveBeenCalledWith(recipePost, mockUser.userId, undefined);
    });

    it('✅ 이미지 파일과 함께 게시글 작성', async () => {
      const mockImageFile = {
        fieldname: 'image',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('test'),
        size: 1024,
      } as Express.Multer.File;

      mockBoardsService.create.mockResolvedValue({
        ...mockPost,
        img_url: '/uploads/images/test-uuid.jpg',
      });

      const result = await controller.create(createPostDto, mockImageFile, mockUser);

      expect(result.img_url).toBeDefined();
      expect(service.create).toHaveBeenCalledWith(createPostDto, mockUser.userId, mockImageFile);
    });
  });

  describe('findAll - 게시글 목록 조회', () => {
    const mockPostsResponse = {
      data: [mockPost],
      meta: {
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      },
    };

    it('✅ 기본 목록 조회 (페이지네이션)', async () => {
      const query: GetPostsQueryDto = {
        page: 1,
        limit: 20,
      };

      mockBoardsService.findAll.mockResolvedValue(mockPostsResponse);

      const result = await controller.findAll(query);

      expect(result.data).toHaveLength(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
      expect(service.findAll).toHaveBeenCalledWith(query);
    });

    it('✅ 검색어로 필터링', async () => {
      const query: GetPostsQueryDto = {
        page: 1,
        limit: 20,
        search: '테스트',
      };

      mockBoardsService.findAll.mockResolvedValue(mockPostsResponse);

      await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ search: '테스트' }),
      );
    });

    it('✅ 말머리로 필터링', async () => {
      const query: GetPostsQueryDto = {
        page: 1,
        limit: 20,
        prefix: 'Recipe',
      };

      mockBoardsService.findAll.mockResolvedValue(mockPostsResponse);

      await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ prefix: 'Recipe' }),
      );
    });

    it('✅ 정렬 옵션 적용', async () => {
      const query: GetPostsQueryDto = {
        page: 1,
        limit: 20,
        sortBy: 'views',
      };

      mockBoardsService.findAll.mockResolvedValue(mockPostsResponse);

      await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ sortBy: 'views' }),
      );
    });
  });

  describe('findOne - 게시글 상세 조회', () => {
    it('✅ 게시글 조회 성공 (조회수 증가)', async () => {
      const postWithIncreasedViews = { ...mockPost, views: 1 };
      mockBoardsService.findOne.mockResolvedValue(postWithIncreasedViews);

      const result = await controller.findOne(1);

      expect(result.id).toBe(1);
      expect(result.views).toBe(1);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });

    it('❌ 존재하지 않는 게시글 조회 - NotFoundException', async () => {
      mockBoardsService.findOne.mockRejectedValue(
        new NotFoundException('ID가 999인 게시글을 찾을 수 없습니다.'),
      );

      await expect(controller.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(controller.findOne(999)).rejects.toThrow(
        'ID가 999인 게시글을 찾을 수 없습니다.',
      );
    });

    it('✅ 작성자 정보 포함', async () => {
      mockBoardsService.findOne.mockResolvedValue(mockPost);

      const result = await controller.findOne(1);

      expect(result.author).toBeDefined();
      expect(result.author.username).toBe('테스터');
      expect(result.author.nickname).toBe('테스트닉');
    });
  });

  describe('update - 게시글 수정', () => {
    const updatePostDto: UpdatePostDto = {
      title: '수정된 제목',
      content: '수정된 내용',
    };

    it('✅ USER - 본인 게시글 수정 성공', async () => {
      mockBoardsService.update.mockResolvedValue({
        ...mockPost,
        ...updatePostDto,
      });

      const result = await controller.update(1, updatePostDto, mockUser);

      expect(result.title).toBe('수정된 제목');
      expect(service.update).toHaveBeenCalledWith(
        1,
        updatePostDto,
        mockUser.userId,
        mockUser.role,
      );
    });

    it('❌ USER - 다른 사람 게시글 수정 불가 - ForbiddenException', async () => {
      mockBoardsService.update.mockRejectedValue(
        new ForbiddenException('본인 또는 관리자만 수정할 수 있습니다.'),
      );

      await expect(controller.update(1, updatePostDto, mockUser)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(controller.update(1, updatePostDto, mockUser)).rejects.toThrow(
        '본인 또는 관리자만 수정할 수 있습니다.',
      );
    });

    it('✅ ADMIN - 모든 게시글 수정 가능', async () => {
      mockBoardsService.update.mockResolvedValue({
        ...mockPost,
        ...updatePostDto,
      });

      const result = await controller.update(1, updatePostDto, mockAdmin);

      expect(result.title).toBe('수정된 제목');
      expect(service.update).toHaveBeenCalledWith(
        1,
        updatePostDto,
        mockAdmin.userId,
        mockAdmin.role,
      );
    });

    it('❌ 존재하지 않는 게시글 수정 - NotFoundException', async () => {
      mockBoardsService.update.mockRejectedValue(
        new NotFoundException('ID가 999인 게시글을 찾을 수 없습니다.'),
      );

      await expect(controller.update(999, updatePostDto, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('✅ 부분 수정 (제목만)', async () => {
      const partialUpdate: UpdatePostDto = {
        title: '제목만 수정',
      };

      mockBoardsService.update.mockResolvedValue({
        ...mockPost,
        title: '제목만 수정',
      });

      const result = await controller.update(1, partialUpdate, mockUser);

      expect(result.title).toBe('제목만 수정');
      expect(result.content).toBe(mockPost.content); // 내용은 변경되지 않음
    });
  });

  describe('remove - 게시글 삭제', () => {
    it('✅ USER - 본인 게시글 삭제 성공', async () => {
      mockBoardsService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(1, mockUser);

      expect(result).toBeUndefined();
      expect(service.remove).toHaveBeenCalledWith(1, mockUser.userId, mockUser.role);
    });

    it('❌ USER - 다른 사람 게시글 삭제 불가 - ForbiddenException', async () => {
      mockBoardsService.remove.mockRejectedValue(
        new ForbiddenException('본인 또는 관리자만 삭제할 수 있습니다.'),
      );

      await expect(controller.remove(1, mockUser)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(controller.remove(1, mockUser)).rejects.toThrow(
        '본인 또는 관리자만 삭제할 수 있습니다.',
      );
    });

    it('✅ ADMIN - 모든 게시글 삭제 가능', async () => {
      mockBoardsService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(1, mockAdmin);

      expect(result).toBeUndefined();
      expect(service.remove).toHaveBeenCalledWith(
        1,
        mockAdmin.userId,
        mockAdmin.role,
      );
    });

    it('❌ 존재하지 않는 게시글 삭제 - NotFoundException', async () => {
      mockBoardsService.remove.mockRejectedValue(
        new NotFoundException('ID가 999인 게시글을 찾을 수 없습니다.'),
      );

      await expect(controller.remove(999, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('✅ 삭제는 반환값이 없어야 함 (void)', async () => {
      mockBoardsService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(1, mockUser);

      expect(result).toBeUndefined();
    });
  });

  describe('권한 통합 테스트', () => {
    it('👤 USER는 본인 게시글만 수정/삭제 가능', async () => {
      const createDto: CreatePostDto = {
        title: '내 게시글',
        content: '내용',
        prefix: 'General',
      };

      // 생성
      mockBoardsService.create.mockResolvedValue(mockPost);
      const created = await controller.create(createDto, undefined, mockUser);
      expect(created.authorId).toBe(mockUser.userId);

      // 본인 게시글 수정 성공
      const updateDto: UpdatePostDto = { title: '수정됨' };
      mockBoardsService.update.mockResolvedValue({
        ...mockPost,
        title: '수정됨',
      });
      const updated = await controller.update(1, updateDto, mockUser);
      expect(updated.title).toBe('수정됨');

      // 본인 게시글 삭제 성공
      mockBoardsService.remove.mockResolvedValue(undefined);
      await expect(controller.remove(1, mockUser)).resolves.toBeUndefined();
    });

    it('👮 ADMIN은 모든 게시글 수정/삭제 가능', async () => {
      // 조회
      mockBoardsService.findOne.mockResolvedValue(mockPost);
      const post = await controller.findOne(1);
      expect(post.id).toBe(1);

      // 다른 사람 게시글 수정
      const updateDto: UpdatePostDto = { title: 'ADMIN 수정' };
      mockBoardsService.update.mockResolvedValue({
        ...mockPost,
        title: 'ADMIN 수정',
      });
      const updated = await controller.update(1, updateDto, mockAdmin);
      expect(updated.title).toBe('ADMIN 수정');

      // 다른 사람 게시글 삭제
      mockBoardsService.remove.mockResolvedValue(undefined);
      await expect(controller.remove(1, mockAdmin)).resolves.toBeUndefined();
    });

    it('🔒 USER가 다른 사람 게시글 수정 시 ForbiddenException', async () => {
      const otherUserPost = { ...mockPost, authorId: 'other-user-uuid' };
      mockBoardsService.findOne.mockResolvedValue(otherUserPost);

      const updateDto: UpdatePostDto = { title: '해킹 시도' };
      mockBoardsService.update.mockRejectedValue(
        new ForbiddenException('본인 또는 관리자만 수정할 수 있습니다.'),
      );

      await expect(controller.update(1, updateDto, mockUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('🔒 USER가 다른 사람 게시글 삭제 시 ForbiddenException', async () => {
      mockBoardsService.remove.mockRejectedValue(
        new ForbiddenException('본인 또는 관리자만 삭제할 수 있습니다.'),
      );

      await expect(controller.remove(1, mockUser)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
