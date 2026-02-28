import { Test, TestingModule } from '@nestjs/testing';
import { RatingService } from './rating.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostRating } from './entities/post-rating.entity';
import { Post } from './entities/post.entity';
import { RatePostDto } from './dto/rate-post.dto';
import { NotFoundException } from '@nestjs/common';

describe('RatingService', () => {
  let service: RatingService;
  let ratingsRepository: Repository<PostRating>;
  let postsRepository: Repository<Post>;

  const mockRatingsRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockPostsRepository = {
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockPost = {
    id: 1,
    title: '테스트 게시글',
    content: '게시글 내용',
    authorId: 'author-uuid',
    averageRating: 0,
    ratingCount: 0,
  };

  const mockRating = {
    id: 1,
    postId: 1,
    userId: 'user-uuid-1',
    score: 5,
    comment: '정말 유익한 게시글입니다!',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RatingService,
        {
          provide: getRepositoryToken(PostRating),
          useValue: mockRatingsRepository,
        },
        {
          provide: getRepositoryToken(Post),
          useValue: mockPostsRepository,
        },
      ],
    }).compile();

    service = module.get<RatingService>(RatingService);
    ratingsRepository = module.get<Repository<PostRating>>(
      getRepositoryToken(PostRating),
    );
    postsRepository = module.get<Repository<Post>>(getRepositoryToken(Post));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('ratePost - 별점 주기/수정 (Upsert)', () => {
    const ratePostDto: RatePostDto = {
      rating: 5,
      comment: '정말 유익한 게시글입니다!',
    };
    const boardId = 1;
    const userId = 'user-uuid-1';

    const mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getRawOne: jest.fn(),
    };

    beforeEach(() => {
      mockRatingsRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    });

    it('✅ 별점 생성 성공 (첫 별점)', async () => {
      mockPostsRepository.findOne.mockResolvedValue(mockPost);
      mockRatingsRepository.findOne.mockResolvedValue(null); // 기존 별점 없음
      mockRatingsRepository.create.mockReturnValue(mockRating);
      mockRatingsRepository.save.mockResolvedValue(mockRating);
      mockQueryBuilder.getRawOne.mockResolvedValue({
        average: '5.0',
        count: '1',
      });
      mockPostsRepository.update.mockResolvedValue(undefined);

      const result = await service.ratePost(boardId, ratePostDto, userId);

      expect(result).toEqual(mockRating);
      expect(ratingsRepository.create).toHaveBeenCalledWith({
        postId: boardId,
        userId,
        score: ratePostDto.rating,
        comment: ratePostDto.comment,
      });
      expect(ratingsRepository.save).toHaveBeenCalled();
    });

    it('✅ 별점 수정 성공 (기존 별점 업데이트)', async () => {
      const existingRating = { ...mockRating, score: 3, comment: '기존 코멘트' };
      const updateDto: RatePostDto = { rating: 5, comment: '수정된 코멘트' };

      mockPostsRepository.findOne.mockResolvedValue(mockPost);
      mockRatingsRepository.findOne.mockResolvedValue(existingRating);
      mockRatingsRepository.save.mockResolvedValue({
        ...existingRating,
        score: 5,
        comment: '수정된 코멘트',
      });
      mockQueryBuilder.getRawOne.mockResolvedValue({
        average: '5.0',
        count: '1',
      });
      mockPostsRepository.update.mockResolvedValue(undefined);

      const result = await service.ratePost(boardId, updateDto, userId);

      expect(result.score).toBe(5);
      expect(result.comment).toBe('수정된 코멘트');
      expect(ratingsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ score: 5, comment: '수정된 코멘트' }),
      );
      expect(ratingsRepository.create).not.toHaveBeenCalled(); // 생성 안 됨
    });

    it('✅ 별점 생성 후 게시글 통계 업데이트', async () => {
      mockPostsRepository.findOne.mockResolvedValue(mockPost);
      mockRatingsRepository.findOne.mockResolvedValue(null);
      mockRatingsRepository.create.mockReturnValue(mockRating);
      mockRatingsRepository.save.mockResolvedValue(mockRating);
      mockQueryBuilder.getRawOne.mockResolvedValue({
        average: '5.0',
        count: '1',
      });
      mockPostsRepository.update.mockResolvedValue(undefined);

      await service.ratePost(boardId, ratePostDto, userId);

      expect(postsRepository.update).toHaveBeenCalledWith(boardId, {
        averageRating: 5.0,
        ratingCount: 1,
      });
    });

    it('✅ 별점 수정 후 게시글 통계 업데이트', async () => {
      const existingRating = { ...mockRating, score: 3 };

      mockPostsRepository.findOne.mockResolvedValue(mockPost);
      mockRatingsRepository.findOne.mockResolvedValue(existingRating);
      mockRatingsRepository.save.mockResolvedValue({
        ...existingRating,
        score: 5,
      });
      mockQueryBuilder.getRawOne.mockResolvedValue({
        average: '4.5',
        count: '2',
      });
      mockPostsRepository.update.mockResolvedValue(undefined);

      await service.ratePost(boardId, { rating: 5 }, userId);

      expect(postsRepository.update).toHaveBeenCalledWith(boardId, {
        averageRating: 4.5,
        ratingCount: 2,
      });
    });

    it('❌ 존재하지 않는 게시글 - NotFoundException', async () => {
      mockPostsRepository.findOne.mockResolvedValue(null);

      await expect(service.ratePost(999, ratePostDto, userId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.ratePost(999, ratePostDto, userId)).rejects.toThrow(
        'ID가 999인 게시글을 찾을 수 없습니다.',
      );

      expect(ratingsRepository.save).not.toHaveBeenCalled();
      expect(postsRepository.update).not.toHaveBeenCalled();
    });

    it('✅ 다양한 별점 값 (1~5)', async () => {
      for (let score = 1; score <= 5; score++) {
        mockPostsRepository.findOne.mockResolvedValue(mockPost);
        mockRatingsRepository.findOne.mockResolvedValue(null);
        mockRatingsRepository.create.mockReturnValue({
          ...mockRating,
          score,
          comment: `${score}점 평가`,
        });
        mockRatingsRepository.save.mockResolvedValue({
          ...mockRating,
          score,
          comment: `${score}점 평가`,
        });
        mockQueryBuilder.getRawOne.mockResolvedValue({
          average: score.toString(),
          count: '1',
        });
        mockPostsRepository.update.mockResolvedValue(undefined);

        const result = await service.ratePost(
          boardId,
          { rating: score, comment: `${score}점 평가` },
          userId,
        );

        expect(result.score).toBe(score);
        expect(result.comment).toBe(`${score}점 평가`);
      }

      expect(ratingsRepository.save).toHaveBeenCalledTimes(5);
    });

    it('✅ 여러 유저가 별점을 주는 경우 평균 계산', async () => {
      // user1: 5점
      mockPostsRepository.findOne.mockResolvedValue(mockPost);
      mockRatingsRepository.findOne.mockResolvedValue(null);
      mockRatingsRepository.create.mockReturnValue(mockRating);
      mockRatingsRepository.save.mockResolvedValue(mockRating);
      mockQueryBuilder.getRawOne.mockResolvedValue({
        average: '5.0',
        count: '1',
      });
      mockPostsRepository.update.mockResolvedValue(undefined);

      await service.ratePost(boardId, { rating: 5 }, 'user-1');

      // user2: 3점 (평균: (5+3)/2 = 4.0)
      mockRatingsRepository.findOne.mockResolvedValue(null);
      mockRatingsRepository.create.mockReturnValue({
        ...mockRating,
        userId: 'user-2',
        score: 3,
      });
      mockRatingsRepository.save.mockResolvedValue({
        ...mockRating,
        userId: 'user-2',
        score: 3,
      });
      mockQueryBuilder.getRawOne.mockResolvedValue({
        average: '4.0',
        count: '2',
      });

      await service.ratePost(boardId, { rating: 3 }, 'user-2');

      expect(postsRepository.update).toHaveBeenLastCalledWith(boardId, {
        averageRating: 4.0,
        ratingCount: 2,
      });
    });
  });

  describe('getAverageRating - 평균 별점 조회', () => {
    it('✅ 평균 별점 조회 성공', async () => {
      const postWithRatings = {
        ...mockPost,
        averageRating: 4.5,
        ratingCount: 10,
      };

      mockPostsRepository.findOne.mockResolvedValue(postWithRatings);

      const result = await service.getAverageRating(1);

      expect(result).toEqual({
        averageRating: 4.5,
        ratingCount: 10,
      });
      expect(postsRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        select: ['id', 'averageRating', 'ratingCount'],
      });
    });

    it('✅ 별점이 없는 게시글 (0점, 0개)', async () => {
      mockPostsRepository.findOne.mockResolvedValue(mockPost);

      const result = await service.getAverageRating(1);

      expect(result).toEqual({
        averageRating: 0,
        ratingCount: 0,
      });
    });

    it('✅ averageRating이 null인 경우 0으로 처리', async () => {
      const postWithNullRating = {
        ...mockPost,
        averageRating: null,
        ratingCount: null,
      };

      mockPostsRepository.findOne.mockResolvedValue(postWithNullRating);

      const result = await service.getAverageRating(1);

      expect(result.averageRating).toBe(0);
      expect(result.ratingCount).toBe(0);
    });

    it('❌ 존재하지 않는 게시글 - NotFoundException', async () => {
      mockPostsRepository.findOne.mockResolvedValue(null);

      await expect(service.getAverageRating(999)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getAverageRating(999)).rejects.toThrow(
        'ID가 999인 게시글을 찾을 수 없습니다.',
      );
    });

    it('✅ 다양한 평균 별점 값', async () => {
      const testCases = [
        { averageRating: 1.0, ratingCount: 1 },
        { averageRating: 2.5, ratingCount: 10 },
        { averageRating: 3.7, ratingCount: 23 },
        { averageRating: 4.9, ratingCount: 100 },
        { averageRating: 5.0, ratingCount: 50 },
      ];

      for (const testCase of testCases) {
        mockPostsRepository.findOne.mockResolvedValue({
          ...mockPost,
          ...testCase,
        });

        const result = await service.getAverageRating(1);

        expect(result.averageRating).toBe(testCase.averageRating);
        expect(result.ratingCount).toBe(testCase.ratingCount);
      }
    });
  });

  describe('getMyRating - 내가 준 별점 조회', () => {
    const boardId = 1;
    const userId = 'user-uuid-1';

    it('✅ 내가 준 별점 조회 성공', async () => {
      mockPostsRepository.findOne.mockResolvedValue(mockPost);
      mockRatingsRepository.findOne.mockResolvedValue(mockRating);

      const result = await service.getMyRating(boardId, userId);

      expect(result).toEqual({ 
        rating: 5,
        comment: '정말 유익한 게시글입니다!'
      });
      expect(ratingsRepository.findOne).toHaveBeenCalledWith({
        where: { postId: boardId, userId },
        select: ['score', 'comment'],
      });
    });

    it('✅ 별점을 주지 않은 경우 null 반환', async () => {
      mockPostsRepository.findOne.mockResolvedValue(mockPost);
      mockRatingsRepository.findOne.mockResolvedValue(null);

      const result = await service.getMyRating(boardId, userId);

      expect(result).toEqual({ rating: null, comment: null });
    });

    it('✅ 다른 유저의 별점은 조회되지 않음', async () => {
      mockPostsRepository.findOne.mockResolvedValue(mockPost);

      // user-1이 조회
      mockRatingsRepository.findOne.mockResolvedValue({
        ...mockRating,
        userId: 'user-1',
        score: 5,
        comment: 'user-1의 코멘트',
      });
      const result1 = await service.getMyRating(boardId, 'user-1');
      expect(result1.rating).toBe(5);
      expect(result1.comment).toBe('user-1의 코멘트');

      // user-2가 조회 (별점 없음)
      mockRatingsRepository.findOne.mockResolvedValue(null);
      const result2 = await service.getMyRating(boardId, 'user-2');
      expect(result2.rating).toBeNull();
      expect(result2.comment).toBeNull();

      expect(ratingsRepository.findOne).toHaveBeenNthCalledWith(1, {
        where: { postId: boardId, userId: 'user-1' },
        select: ['score', 'comment'],
      });
      expect(ratingsRepository.findOne).toHaveBeenNthCalledWith(2, {
        where: { postId: boardId, userId: 'user-2' },
        select: ['score', 'comment'],
      });
    });

    it('❌ 존재하지 않는 게시글 - NotFoundException', async () => {
      mockPostsRepository.findOne.mockResolvedValue(null);

      await expect(service.getMyRating(999, userId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getMyRating(999, userId)).rejects.toThrow(
        'ID가 999인 게시글을 찾을 수 없습니다.',
      );
    });

    it('✅ 다양한 별점 값 조회', async () => {
      mockPostsRepository.findOne.mockResolvedValue(mockPost);

      for (let score = 1; score <= 5; score++) {
        mockRatingsRepository.findOne.mockResolvedValue({
          ...mockRating,
          score,
          comment: `${score}점 코멘트`,
        });

        const result = await service.getMyRating(boardId, userId);
        expect(result.rating).toBe(score);
        expect(result.comment).toBe(`${score}점 코멘트`);
      }
    });
  });

  describe('deleteRating - 별점 삭제', () => {
    const boardId = 1;
    const userId = 'user-uuid-1';

    const mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getRawOne: jest.fn(),
    };

    beforeEach(() => {
      mockRatingsRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    });

    it('✅ 별점 삭제 성공', async () => {
      mockPostsRepository.findOne.mockResolvedValue(mockPost);
      mockRatingsRepository.findOne.mockResolvedValue(mockRating);
      mockRatingsRepository.delete.mockResolvedValue({ affected: 1 });
      mockQueryBuilder.getRawOne.mockResolvedValue({
        average: '0',
        count: '0',
      });
      mockPostsRepository.update.mockResolvedValue(undefined);

      await service.deleteRating(boardId, userId);

      expect(ratingsRepository.findOne).toHaveBeenCalledWith({
        where: { postId: boardId, userId },
      });
      expect(ratingsRepository.delete).toHaveBeenCalledWith(mockRating.id);
    });

    it('✅ 삭제 후 게시글 통계 업데이트', async () => {
      mockPostsRepository.findOne.mockResolvedValue(mockPost);
      mockRatingsRepository.findOne.mockResolvedValue(mockRating);
      mockRatingsRepository.delete.mockResolvedValue({ affected: 1 });
      mockQueryBuilder.getRawOne.mockResolvedValue({
        average: '4.0',
        count: '2',
      });
      mockPostsRepository.update.mockResolvedValue(undefined);

      await service.deleteRating(boardId, userId);

      expect(postsRepository.update).toHaveBeenCalledWith(boardId, {
        averageRating: 4.0,
        ratingCount: 2,
      });
    });

    it('✅ 마지막 별점 삭제 시 평균 0으로 업데이트', async () => {
      mockPostsRepository.findOne.mockResolvedValue(mockPost);
      mockRatingsRepository.findOne.mockResolvedValue(mockRating);
      mockRatingsRepository.delete.mockResolvedValue({ affected: 1 });
      mockQueryBuilder.getRawOne.mockResolvedValue({
        average: null,
        count: '0',
      });
      mockPostsRepository.update.mockResolvedValue(undefined);

      await service.deleteRating(boardId, userId);

      expect(postsRepository.update).toHaveBeenCalledWith(boardId, {
        averageRating: 0,
        ratingCount: 0,
      });
    });

    it('✅ 반환값이 없어야 함 (void)', async () => {
      mockPostsRepository.findOne.mockResolvedValue(mockPost);
      mockRatingsRepository.findOne.mockResolvedValue(mockRating);
      mockRatingsRepository.delete.mockResolvedValue({ affected: 1 });
      mockQueryBuilder.getRawOne.mockResolvedValue({
        average: '0',
        count: '0',
      });
      mockPostsRepository.update.mockResolvedValue(undefined);

      const result = await service.deleteRating(boardId, userId);

      expect(result).toBeUndefined();
    });

    it('❌ 존재하지 않는 게시글 - NotFoundException', async () => {
      mockPostsRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteRating(999, userId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.deleteRating(999, userId)).rejects.toThrow(
        'ID가 999인 게시글을 찾을 수 없습니다.',
      );

      expect(ratingsRepository.delete).not.toHaveBeenCalled();
      expect(postsRepository.update).not.toHaveBeenCalled();
    });

    it('❌ 본인의 별점이 없는 경우 - NotFoundException', async () => {
      mockPostsRepository.findOne.mockResolvedValue(mockPost);
      mockRatingsRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteRating(boardId, userId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.deleteRating(boardId, userId)).rejects.toThrow(
        '해당 게시글에 대한 별점을 찾을 수 없습니다.',
      );

      expect(ratingsRepository.delete).not.toHaveBeenCalled();
    });

    it('✅ 다른 유저의 별점은 삭제할 수 없음', async () => {
      mockPostsRepository.findOne.mockResolvedValue(mockPost);
      mockRatingsRepository.findOne.mockResolvedValue(null); // 본인 별점 없음

      await expect(service.deleteRating(boardId, 'other-user')).rejects.toThrow(
        NotFoundException,
      );

      expect(ratingsRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('updatePostRatingStats - 게시글 통계 업데이트 (Private Method)', () => {
    const boardId = 1;

    const mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getRawOne: jest.fn(),
    };

    beforeEach(() => {
      mockRatingsRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    });

    it('✅ 평균 별점 계산 및 업데이트', async () => {
      mockPostsRepository.findOne.mockResolvedValue(mockPost);
      mockRatingsRepository.findOne.mockResolvedValue(null);
      mockRatingsRepository.create.mockReturnValue(mockRating);
      mockRatingsRepository.save.mockResolvedValue(mockRating);
      mockQueryBuilder.getRawOne.mockResolvedValue({
        average: '4.5',
        count: '10',
      });
      mockPostsRepository.update.mockResolvedValue(undefined);

      await service.ratePost(boardId, { rating: 5 }, 'user-uuid-1');

      expect(ratingsRepository.createQueryBuilder).toHaveBeenCalledWith('rating');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith(
        'AVG(rating.score)',
        'average',
      );
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith(
        'COUNT(rating.id)',
        'count',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'rating.postId = :boardId',
        { boardId },
      );
      expect(postsRepository.update).toHaveBeenCalledWith(boardId, {
        averageRating: 4.5,
        ratingCount: 10,
      });
    });

    it('✅ 별점이 없을 때 0으로 업데이트', async () => {
      mockPostsRepository.findOne.mockResolvedValue(mockPost);
      mockRatingsRepository.findOne.mockResolvedValue(mockRating);
      mockRatingsRepository.delete.mockResolvedValue({ affected: 1 });
      mockQueryBuilder.getRawOne.mockResolvedValue({
        average: null,
        count: '0',
      });
      mockPostsRepository.update.mockResolvedValue(undefined);

      await service.deleteRating(boardId, 'user-uuid-1');

      expect(postsRepository.update).toHaveBeenCalledWith(boardId, {
        averageRating: 0,
        ratingCount: 0,
      });
    });

    it('✅ 소수점 평균 계산', async () => {
      mockPostsRepository.findOne.mockResolvedValue(mockPost);
      mockRatingsRepository.findOne.mockResolvedValue(null);
      mockRatingsRepository.create.mockReturnValue(mockRating);
      mockRatingsRepository.save.mockResolvedValue(mockRating);
      mockQueryBuilder.getRawOne.mockResolvedValue({
        average: '3.666666666666667',
        count: '3',
      });
      mockPostsRepository.update.mockResolvedValue(undefined);

      await service.ratePost(boardId, { rating: 5 }, 'user-uuid-1');

      expect(postsRepository.update).toHaveBeenCalledWith(boardId, {
        averageRating: 3.666666666666667,
        ratingCount: 3,
      });
    });
  });

  describe('통합 시나리오 테스트', () => {
    const boardId = 1;
    const userId = 'user-uuid-1';

    const mockQueryBuilder = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getRawOne: jest.fn(),
    };

    beforeEach(() => {
      mockRatingsRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
    });

    it('✅ 전체 플로우: 생성 → 조회 → 수정 → 삭제', async () => {
      // 1. 별점 생성 (5점)
      mockPostsRepository.findOne.mockResolvedValue(mockPost);
      mockRatingsRepository.findOne.mockResolvedValue(null);
      mockRatingsRepository.create.mockReturnValue(mockRating);
      mockRatingsRepository.save.mockResolvedValue(mockRating);
      mockQueryBuilder.getRawOne.mockResolvedValue({
        average: '5.0',
        count: '1',
      });
      mockPostsRepository.update.mockResolvedValue(undefined);

      const created = await service.ratePost(boardId, { rating: 5 }, userId);
      expect(created.score).toBe(5);

      // 2. 평균 별점 조회
      mockPostsRepository.findOne.mockResolvedValue({
        ...mockPost,
        averageRating: 5.0,
        ratingCount: 1,
      });
      const average1 = await service.getAverageRating(boardId);
      expect(average1.averageRating).toBe(5.0);
      expect(average1.ratingCount).toBe(1);

      // 3. 내 별점 조회
      mockPostsRepository.findOne.mockResolvedValue(mockPost);
      mockRatingsRepository.findOne.mockResolvedValue(mockRating);
      const myRating1 = await service.getMyRating(boardId, userId);
      expect(myRating1.rating).toBe(5);
      expect(myRating1.comment).toBe('정말 유익한 게시글입니다!');

      // 4. 별점 수정 (3점)
      mockRatingsRepository.findOne.mockResolvedValue(mockRating);
      mockRatingsRepository.save.mockResolvedValue({
        ...mockRating,
        score: 3,
        comment: '수정된 코멘트',
      });
      mockQueryBuilder.getRawOne.mockResolvedValue({
        average: '3.0',
        count: '1',
      });

      const updated = await service.ratePost(boardId, { rating: 3, comment: '수정된 코멘트' }, userId);
      expect(updated.score).toBe(3);
      expect(updated.comment).toBe('수정된 코멘트');

      // 5. 별점 삭제
      mockRatingsRepository.findOne.mockResolvedValue({
        ...mockRating,
        score: 3,
      });
      mockRatingsRepository.delete.mockResolvedValue({ affected: 1 });
      mockQueryBuilder.getRawOne.mockResolvedValue({
        average: null,
        count: '0',
      });

      await service.deleteRating(boardId, userId);
      expect(ratingsRepository.delete).toHaveBeenCalled();

      // 6. 삭제 후 평균 별점 조회
      mockPostsRepository.findOne.mockResolvedValue({
        ...mockPost,
        averageRating: 0,
        ratingCount: 0,
      });
      const average2 = await service.getAverageRating(boardId);
      expect(average2.averageRating).toBe(0);
      expect(average2.ratingCount).toBe(0);
    });

    it('✅ 여러 유저 시나리오: 평균 별점 계산', async () => {
      mockPostsRepository.findOne.mockResolvedValue(mockPost);

      // user1: 5점
      mockRatingsRepository.findOne.mockResolvedValue(null);
      mockRatingsRepository.create.mockReturnValue({
        ...mockRating,
        userId: 'user-1',
        score: 5,
      });
      mockRatingsRepository.save.mockResolvedValue({
        ...mockRating,
        userId: 'user-1',
        score: 5,
      });
      mockQueryBuilder.getRawOne.mockResolvedValue({
        average: '5.0',
        count: '1',
      });
      mockPostsRepository.update.mockResolvedValue(undefined);
      await service.ratePost(boardId, { rating: 5 }, 'user-1');

      // user2: 3점 (평균: 4.0)
      mockRatingsRepository.findOne.mockResolvedValue(null);
      mockRatingsRepository.create.mockReturnValue({
        ...mockRating,
        userId: 'user-2',
        score: 3,
      });
      mockRatingsRepository.save.mockResolvedValue({
        ...mockRating,
        userId: 'user-2',
        score: 3,
      });
      mockQueryBuilder.getRawOne.mockResolvedValue({
        average: '4.0',
        count: '2',
      });
      await service.ratePost(boardId, { rating: 3 }, 'user-2');

      // user3: 4점 (평균: 4.0)
      mockRatingsRepository.findOne.mockResolvedValue(null);
      mockRatingsRepository.create.mockReturnValue({
        ...mockRating,
        userId: 'user-3',
        score: 4,
      });
      mockRatingsRepository.save.mockResolvedValue({
        ...mockRating,
        userId: 'user-3',
        score: 4,
      });
      mockQueryBuilder.getRawOne.mockResolvedValue({
        average: '4.0',
        count: '3',
      });
      await service.ratePost(boardId, { rating: 4 }, 'user-3');

      expect(postsRepository.update).toHaveBeenLastCalledWith(boardId, {
        averageRating: 4.0,
        ratingCount: 3,
      });
    });

    it('✅ 본인만 수정/삭제 가능', async () => {
      const user1 = 'user-1';
      const user2 = 'user-2';

      mockPostsRepository.findOne.mockResolvedValue(mockPost);

      // user1이 별점 생성
      mockRatingsRepository.findOne.mockResolvedValue(null);
      mockRatingsRepository.create.mockReturnValue({
        ...mockRating,
        userId: user1,
      });
      mockRatingsRepository.save.mockResolvedValue({
        ...mockRating,
        userId: user1,
      });
      mockQueryBuilder.getRawOne.mockResolvedValue({
        average: '5.0',
        count: '1',
      });
      mockPostsRepository.update.mockResolvedValue(undefined);
      await service.ratePost(boardId, { rating: 5 }, user1);

      // user2가 user1의 별점 조회 시 null
      mockRatingsRepository.findOne.mockResolvedValue(null);
      const user2Rating = await service.getMyRating(boardId, user2);
      expect(user2Rating.rating).toBeNull();

      // user2가 user1의 별점 삭제 시도 (본인 별점 없음)
      await expect(service.deleteRating(boardId, user2)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
