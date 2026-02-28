import { Test, TestingModule } from '@nestjs/testing';
import { BoardsService } from './boards.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { GetPostsQueryDto } from './dto/get-posts-query.dto';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('BoardsService', () => {
  let service: BoardsService;
  let repository: Repository<Post>;

  const mockPostsRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
    increment: jest.fn(),
    createQueryBuilder: jest.fn(),
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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BoardsService,
        {
          provide: getRepositoryToken(Post),
          useValue: mockPostsRepository,
        },
      ],
    }).compile();

    service = module.get<BoardsService>(BoardsService);
    repository = module.get<Repository<Post>>(getRepositoryToken(Post));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create - 게시글 작성', () => {
    const createPostDto: CreatePostDto = {
      title: '새 게시글',
      content: '게시글 내용',
      prefix: 'General',
    };
    const authorId = 'user-uuid-1';

    it('✅ 게시글 생성 성공', async () => {
      const savedPost = { ...mockPost, ...createPostDto, authorId };
      mockPostsRepository.create.mockReturnValue(savedPost);
      mockPostsRepository.save.mockResolvedValue(savedPost);

      const result = await service.create(createPostDto, authorId);

      expect(result.title).toBe(createPostDto.title);
      expect(result.authorId).toBe(authorId);
      expect(repository.create).toHaveBeenCalledWith({
        ...createPostDto,
        authorId,
      });
      expect(repository.save).toHaveBeenCalledWith(savedPost);
    });

    it('✅ 말머리가 있는 게시글 생성', async () => {
      const recipePost: CreatePostDto = {
        title: '맛있는 레시피',
        content: '레시피 내용',
        prefix: 'Recipe',
      };
      const savedPost = { ...mockPost, ...recipePost, authorId };
      mockPostsRepository.create.mockReturnValue(savedPost);
      mockPostsRepository.save.mockResolvedValue(savedPost);

      const result = await service.create(recipePost, authorId);

      expect(result.prefix).toBe('Recipe');
    });

    it('✅ authorId가 자동으로 설정됨', async () => {
      const savedPost = { ...mockPost, ...createPostDto, authorId };
      mockPostsRepository.create.mockReturnValue(savedPost);
      mockPostsRepository.save.mockResolvedValue(savedPost);

      await service.create(createPostDto, authorId);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ authorId }),
      );
    });
  });

  describe('findAll - 게시글 목록 조회', () => {
    const mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
    };

    beforeEach(() => {
      mockPostsRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    });

    it('✅ 기본 목록 조회 (페이지네이션)', async () => {
      const query: GetPostsQueryDto = {
        page: 1,
        limit: 20,
      };

      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockPost], 1]);

      const result = await service.findAll(query);

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
      expect(result.meta.totalPages).toBe(1);
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(20);
    });

    it('✅ 2페이지 조회', async () => {
      const query: GetPostsQueryDto = {
        page: 2,
        limit: 20,
      };

      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockPost], 25]);

      const result = await service.findAll(query);

      expect(result.meta.page).toBe(2);
      expect(result.meta.totalPages).toBe(2);
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(20);
    });

    it('✅ 검색어로 필터링', async () => {
      const query: GetPostsQueryDto = {
        page: 1,
        limit: 20,
        search: '테스트',
      };

      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockPost], 1]);

      await service.findAll(query);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(post.title ILIKE :search OR post.content ILIKE :search)',
        { search: '%테스트%' },
      );
    });

    it('✅ 말머리로 필터링', async () => {
      const query: GetPostsQueryDto = {
        page: 1,
        limit: 20,
        prefix: 'Recipe',
      };

      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockPost], 1]);

      await service.findAll(query);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'post.prefix = :prefix',
        { prefix: 'Recipe' },
      );
    });

    it('✅ 최신순 정렬 (기본값)', async () => {
      const query: GetPostsQueryDto = {
        page: 1,
        limit: 20,
        sortBy: 'recent',
      };

      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockPost], 1]);

      await service.findAll(query);

      expect(mockQueryBuilder.addOrderBy).toHaveBeenCalledWith(
        'post.isPinned',
        'DESC',
      );
      expect(mockQueryBuilder.addOrderBy).toHaveBeenCalledWith(
        'post.createdAt',
        'DESC',
      );
    });

    it('✅ 조회수순 정렬', async () => {
      const query: GetPostsQueryDto = {
        page: 1,
        limit: 20,
        sortBy: 'views',
      };

      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockPost], 1]);

      await service.findAll(query);

      expect(mockQueryBuilder.addOrderBy).toHaveBeenCalledWith('post.views', 'DESC');
    });

    it('✅ 평점순 정렬', async () => {
      const query: GetPostsQueryDto = {
        page: 1,
        limit: 20,
        sortBy: 'rating',
      };

      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockPost], 1]);

      await service.findAll(query);

      expect(mockQueryBuilder.addOrderBy).toHaveBeenCalledWith(
        'post.averageRating',
        'DESC',
      );
      expect(mockQueryBuilder.addOrderBy).toHaveBeenCalledWith(
        'post.ratingCount',
        'DESC',
      );
    });

    it('✅ 댓글순 정렬', async () => {
      const query: GetPostsQueryDto = {
        page: 1,
        limit: 20,
        sortBy: 'comments',
      };

      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockPost], 1]);

      await service.findAll(query);

      expect(mockQueryBuilder.addOrderBy).toHaveBeenCalledWith(
        'post.commentCount',
        'DESC',
      );
    });

    it('✅ 고정 게시글은 항상 최상단', async () => {
      const query: GetPostsQueryDto = { page: 1, limit: 20 };

      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockPost], 1]);

      await service.findAll(query);

      expect(mockQueryBuilder.addOrderBy).toHaveBeenCalledWith(
        'post.isPinned',
        'DESC',
      );
    });

    it('✅ 작성자 정보 포함', async () => {
      const query: GetPostsQueryDto = { page: 1, limit: 20 };

      mockQueryBuilder.getManyAndCount.mockResolvedValue([[mockPost], 1]);

      await service.findAll(query);

      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'post.author',
        'author',
      );
      expect(mockQueryBuilder.select).toHaveBeenCalledWith(
        expect.arrayContaining([
          'author.id',
          'author.username',
          'author.nickname',
          'author.role',
        ]),
      );
    });
  });

  describe('findOne - 게시글 상세 조회', () => {
    const mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    };

    beforeEach(() => {
      mockPostsRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    });

    it('✅ 게시글 조회 성공', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(mockPost);
      mockPostsRepository.increment.mockResolvedValue(undefined);

      const result = await service.findOne(1);

      expect(result.id).toBe(1);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('post.id = :id', {
        id: 1,
      });
    });

    it('✅ 조회수 자동 증가', async () => {
      const postCopy = { ...mockPost, views: 0 };
      mockQueryBuilder.getOne.mockResolvedValue(postCopy);
      mockPostsRepository.increment.mockResolvedValue(undefined);

      const result = await service.findOne(1);

      expect(repository.increment).toHaveBeenCalledWith({ id: 1 }, 'views', 1);
      expect(result.views).toBe(1); // 0에서 1로 증가
    });

    it('❌ 존재하지 않는 게시글 조회 - NotFoundException', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow(
        'ID가 999인 게시글을 찾을 수 없습니다.',
      );
    });

    it('✅ 작성자 정보 포함', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(mockPost);
      mockPostsRepository.increment.mockResolvedValue(undefined);

      const result = await service.findOne(1);

      expect(result.author).toBeDefined();
      expect(result.author.username).toBe('테스터');
      expect(result.author['role']).toBeUndefined(); // Mock data doesn't have role, but we check if it was selected in query builder below
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
        'post.author',
        'author',
      );
      expect(mockQueryBuilder.select).toHaveBeenCalledWith(
        expect.arrayContaining([
          'author.id',
          'author.username',
          'author.nickname',
          'author.role',
        ]),
      );
    });

    it('✅ 조회수 증가는 반환값에 반영됨', async () => {
      const postWithZeroViews = { ...mockPost, views: 5 };
      mockQueryBuilder.getOne.mockResolvedValue(postWithZeroViews);
      mockPostsRepository.increment.mockResolvedValue(undefined);

      const result = await service.findOne(1);

      expect(result.views).toBe(6); // 5에서 6으로 증가
    });
  });

  describe('update - 게시글 수정', () => {
    const updatePostDto: UpdatePostDto = {
      title: '수정된 제목',
      content: '수정된 내용',
    };

    describe('시나리오 1: 일반 유저 (USER)', () => {
      const currentUserId = 'user-uuid-1';
      const currentUserRole = 'USER';

      it('✅ 본인 게시글 수정 성공', async () => {
        mockPostsRepository.findOne.mockResolvedValue(mockPost);
        mockPostsRepository.save.mockResolvedValue({
          ...mockPost,
          ...updatePostDto,
        });

        const result = await service.update(
          1,
          updatePostDto,
          currentUserId,
          currentUserRole,
        );

        expect(result.title).toBe('수정된 제목');
        expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
        expect(repository.save).toHaveBeenCalled();
      });

      it('❌ 다른 사람 게시글 수정 불가 - ForbiddenException', async () => {
        const otherUserPost = { ...mockPost, authorId: 'other-user-uuid' };
        mockPostsRepository.findOne.mockResolvedValue(otherUserPost);

        await expect(
          service.update(1, updatePostDto, currentUserId, currentUserRole),
        ).rejects.toThrow(ForbiddenException);

        await expect(
          service.update(1, updatePostDto, currentUserId, currentUserRole),
        ).rejects.toThrow('본인 또는 관리자만 수정할 수 있습니다.');

        expect(repository.save).not.toHaveBeenCalled();
      });
    });

    describe('시나리오 2: 관리자 (ADMIN)', () => {
      const adminUserId = 'admin-uuid';
      const adminRole = 'ADMIN';

      it('✅ 모든 게시글 수정 가능', async () => {
        mockPostsRepository.findOne.mockResolvedValue(mockPost);
        mockPostsRepository.save.mockResolvedValue({
          ...mockPost,
          ...updatePostDto,
        });

        const result = await service.update(1, updatePostDto, adminUserId, adminRole);

        expect(result.title).toBe('수정된 제목');
        expect(repository.save).toHaveBeenCalled();
      });

      it('✅ 다른 유저(ID: user-uuid-1)의 게시글도 수정 가능', async () => {
        mockPostsRepository.findOne.mockResolvedValue(mockPost);
        mockPostsRepository.save.mockResolvedValue({
          ...mockPost,
          ...updatePostDto,
        });

        await service.update(1, updatePostDto, adminUserId, adminRole);

        expect(repository.save).toHaveBeenCalled();
      });
    });

    it('❌ 존재하지 않는 게시글 수정 - NotFoundException', async () => {
      mockPostsRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(999, updatePostDto, 'user-uuid-1', 'USER'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.update(999, updatePostDto, 'user-uuid-1', 'USER'),
      ).rejects.toThrow('ID가 999인 게시글을 찾을 수 없습니다.');
    });

    it('✅ 부분 수정 (제목만)', async () => {
      const partialUpdate: UpdatePostDto = { title: '제목만 수정' };
      mockPostsRepository.findOne.mockResolvedValue(mockPost);
      mockPostsRepository.save.mockResolvedValue({
        ...mockPost,
        title: '제목만 수정',
      });

      const result = await service.update(
        1,
        partialUpdate,
        'user-uuid-1',
        'USER',
      );

      expect(result.title).toBe('제목만 수정');
      expect(result.content).toBe(mockPost.content);
    });

    describe('isPinned 권한 테스트', () => {
      it('✅ ADMIN - isPinned를 true로 변경 성공', async () => {
        mockPostsRepository.findOne.mockResolvedValue(mockPost);
        mockPostsRepository.save.mockResolvedValue({
          ...mockPost,
          isPinned: true,
        });

        const result = await service.update(
          1,
          { isPinned: true },
          'admin-uuid',
          'ADMIN',
        );

        expect(result.isPinned).toBe(true);
        expect(repository.save).toHaveBeenCalled();
      });

      it('✅ ADMIN - isPinned를 false로 변경 성공', async () => {
        const pinnedPost = { ...mockPost, isPinned: true };
        mockPostsRepository.findOne.mockResolvedValue(pinnedPost);
        mockPostsRepository.save.mockResolvedValue({
          ...pinnedPost,
          isPinned: false,
        });

        const result = await service.update(
          1,
          { isPinned: false },
          'admin-uuid',
          'ADMIN',
        );

        expect(result.isPinned).toBe(false);
        expect(repository.save).toHaveBeenCalled();
      });

      it('❌ USER - 본인 게시글이라도 isPinned 변경 불가 (true)', async () => {
        mockPostsRepository.findOne.mockResolvedValue(mockPost);

        await expect(
          service.update(1, { isPinned: true }, 'user-uuid-1', 'USER'),
        ).rejects.toThrow(ForbiddenException);

        await expect(
          service.update(1, { isPinned: true }, 'user-uuid-1', 'USER'),
        ).rejects.toThrow('게시글 고정은 관리자만 변경할 수 있습니다.');

        expect(repository.save).not.toHaveBeenCalled();
      });

      it('❌ USER - 본인 게시글이라도 isPinned 변경 불가 (false)', async () => {
        const pinnedPost = { ...mockPost, isPinned: true };
        mockPostsRepository.findOne.mockResolvedValue(pinnedPost);

        await expect(
          service.update(1, { isPinned: false }, 'user-uuid-1', 'USER'),
        ).rejects.toThrow(ForbiddenException);

        await expect(
          service.update(1, { isPinned: false }, 'user-uuid-1', 'USER'),
        ).rejects.toThrow('게시글 고정은 관리자만 변경할 수 있습니다.');

        expect(repository.save).not.toHaveBeenCalled();
      });

      it('✅ USER - isPinned 없이 다른 필드만 수정 성공', async () => {
        mockPostsRepository.findOne.mockResolvedValue(mockPost);
        mockPostsRepository.save.mockResolvedValue({
          ...mockPost,
          title: '제목만 수정',
        });

        const result = await service.update(
          1,
          { title: '제목만 수정' },
          'user-uuid-1',
          'USER',
        );

        expect(result.title).toBe('제목만 수정');
        expect(result.isPinned).toBe(mockPost.isPinned); // isPinned는 그대로 유지
        expect(repository.save).toHaveBeenCalled();
      });

      it('✅ ADMIN - isPinned와 다른 필드를 동시에 수정 가능', async () => {
        mockPostsRepository.findOne.mockResolvedValue(mockPost);
        mockPostsRepository.save.mockResolvedValue({
          ...mockPost,
          title: '관리자가 수정한 제목',
          isPinned: true,
        });

        const result = await service.update(
          1,
          { title: '관리자가 수정한 제목', isPinned: true },
          'admin-uuid',
          'ADMIN',
        );

        expect(result.title).toBe('관리자가 수정한 제목');
        expect(result.isPinned).toBe(true);
        expect(repository.save).toHaveBeenCalled();
      });
    });
  });

  describe('remove - 게시글 삭제', () => {
    describe('시나리오 1: 일반 유저 (USER)', () => {
      const currentUserId = 'user-uuid-1';
      const currentUserRole = 'USER';

      it('✅ 본인 게시글 삭제 성공', async () => {
        mockPostsRepository.findOne.mockResolvedValue(mockPost);
        mockPostsRepository.delete.mockResolvedValue({ affected: 1 });

        await service.remove(1, currentUserId, currentUserRole);

        expect(repository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
        expect(repository.delete).toHaveBeenCalledWith(1);
      });

      it('❌ 다른 사람 게시글 삭제 불가 - ForbiddenException', async () => {
        const otherUserPost = { ...mockPost, authorId: 'other-user-uuid' };
        mockPostsRepository.findOne.mockResolvedValue(otherUserPost);

        await expect(
          service.remove(1, currentUserId, currentUserRole),
        ).rejects.toThrow(ForbiddenException);

        await expect(
          service.remove(1, currentUserId, currentUserRole),
        ).rejects.toThrow('본인 또는 관리자만 삭제할 수 있습니다.');

        expect(repository.delete).not.toHaveBeenCalled();
      });
    });

    describe('시나리오 2: 관리자 (ADMIN)', () => {
      const adminUserId = 'admin-uuid';
      const adminRole = 'ADMIN';

      it('✅ 모든 게시글 삭제 가능', async () => {
        mockPostsRepository.findOne.mockResolvedValue(mockPost);
        mockPostsRepository.delete.mockResolvedValue({ affected: 1 });

        await service.remove(1, adminUserId, adminRole);

        expect(repository.delete).toHaveBeenCalledWith(1);
      });

      it('✅ 다른 유저의 게시글도 삭제 가능', async () => {
        mockPostsRepository.findOne.mockResolvedValue(mockPost);
        mockPostsRepository.delete.mockResolvedValue({ affected: 1 });

        await service.remove(1, adminUserId, adminRole);

        expect(repository.delete).toHaveBeenCalledWith(1);
      });
    });

    it('❌ 존재하지 않는 게시글 삭제 - NotFoundException', async () => {
      mockPostsRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999, 'user-uuid-1', 'USER')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.remove(999, 'user-uuid-1', 'USER')).rejects.toThrow(
        'ID가 999인 게시글을 찾을 수 없습니다.',
      );
    });

    it('✅ 삭제는 반환값이 없어야 함 (void)', async () => {
      mockPostsRepository.findOne.mockResolvedValue(mockPost);
      mockPostsRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.remove(1, 'user-uuid-1', 'USER');

      expect(result).toBeUndefined();
    });
  });

  describe('권한 통합 테스트', () => {
    const updateDto: UpdatePostDto = { title: '수정됨' };

    describe('USER 역할의 모든 제약사항', () => {
      it('본인만 수정/삭제 가능, 다른 유저는 불가', async () => {
        // 본인 게시글 수정 성공
        mockPostsRepository.findOne.mockResolvedValueOnce(mockPost);
        mockPostsRepository.save.mockResolvedValueOnce({
          ...mockPost,
          title: '수정됨',
        });
        const updated = await service.update(1, updateDto, 'user-uuid-1', 'USER');
        expect(updated.title).toBe('수정됨');

        // 다른 유저 게시글 수정 실패
        const otherUserPost = { ...mockPost, authorId: 'other-user-uuid' };
        mockPostsRepository.findOne.mockResolvedValueOnce(otherUserPost);
        await expect(
          service.update(1, updateDto, 'user-uuid-1', 'USER'),
        ).rejects.toThrow(ForbiddenException);

        // 본인 게시글 삭제 성공
        mockPostsRepository.findOne.mockResolvedValueOnce(mockPost);
        mockPostsRepository.delete.mockResolvedValueOnce({ affected: 1 });
        await expect(
          service.remove(1, 'user-uuid-1', 'USER'),
        ).resolves.toBeUndefined();

        // 다른 유저 게시글 삭제 실패
        mockPostsRepository.findOne.mockResolvedValueOnce(otherUserPost);
        await expect(
          service.remove(1, 'user-uuid-1', 'USER'),
        ).rejects.toThrow(ForbiddenException);
      });
    });

    describe('ADMIN 역할의 모든 권한', () => {
      it('모든 게시글 조회, 수정, 삭제 가능', async () => {
        const mockQueryBuilder = {
          leftJoinAndSelect: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          getOne: jest.fn().mockResolvedValue(mockPost),
        };

        // 게시글 조회
        mockPostsRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
        mockPostsRepository.increment.mockResolvedValue(undefined);
        const post = await service.findOne(1);
        expect(post.id).toBe(1);

        // 다른 유저 게시글 수정
        mockPostsRepository.findOne.mockResolvedValueOnce(mockPost);
        mockPostsRepository.save.mockResolvedValueOnce({
          ...mockPost,
          title: 'ADMIN 수정',
        });
        const updated = await service.update(
          1,
          { title: 'ADMIN 수정' },
          'admin-uuid',
          'ADMIN',
        );
        expect(updated.title).toBe('ADMIN 수정');

        // 다른 유저 게시글 삭제
        mockPostsRepository.findOne.mockResolvedValueOnce(mockPost);
        mockPostsRepository.delete.mockResolvedValueOnce({ affected: 1 });
        await expect(
          service.remove(1, 'admin-uuid', 'ADMIN'),
        ).resolves.toBeUndefined();
      });
    });
  });
});
