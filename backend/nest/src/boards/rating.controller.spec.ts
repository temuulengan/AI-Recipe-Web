import { Test, TestingModule } from '@nestjs/testing';
import { RatingController } from './rating.controller';
import { RatingService } from './rating.service';
import { RatePostDto } from './dto/rate-post.dto';
import { NotFoundException } from '@nestjs/common';

describe('RatingController', () => {
  let controller: RatingController;
  let service: RatingService;

  const mockRatingService = {
    ratePost: jest.fn(),
    getAverageRating: jest.fn(),
    getMyRating: jest.fn(),
    deleteRating: jest.fn(),
  };

  const mockUser = {
    userId: 'user-uuid-1',
    username: 'testuser',
    role: 'USER',
  };

  const mockAdmin = {
    userId: 'admin-uuid',
    username: 'admin',
    role: 'ADMIN',
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
      controllers: [RatingController],
      providers: [
        {
          provide: RatingService,
          useValue: mockRatingService,
        },
      ],
    }).compile();

    controller = module.get<RatingController>(RatingController);
    service = module.get<RatingService>(RatingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /api/v1/boards/:boardId/rating - 별점 주기/수정', () => {
    const ratePostDto: RatePostDto = {
      rating: 5,
      comment: '정말 유익한 게시글입니다!',
    };
    const boardId = 1;

    it('✅ USER가 별점 생성 성공', async () => {
      mockRatingService.ratePost.mockResolvedValue(mockRating);

      const result = await controller.ratePost(boardId, ratePostDto, mockUser);

      expect(result).toEqual(mockRating);
      expect(service.ratePost).toHaveBeenCalledWith(
        boardId,
        ratePostDto,
        mockUser.userId,
      );
      expect(service.ratePost).toHaveBeenCalledTimes(1);
    });

    it('✅ ADMIN이 별점 생성 성공', async () => {
      mockRatingService.ratePost.mockResolvedValue({
        ...mockRating,
        userId: mockAdmin.userId,
      });

      const result = await controller.ratePost(boardId, ratePostDto, mockAdmin);

      expect(result.userId).toBe(mockAdmin.userId);
      expect(service.ratePost).toHaveBeenCalledWith(
        boardId,
        ratePostDto,
        mockAdmin.userId,
      );
    });

    it('✅ 기존 별점 수정 (같은 유저가 다시 별점 주기)', async () => {
      const updateDto: RatePostDto = { rating: 3, comment: '수정된 코멘트' };
      mockRatingService.ratePost.mockResolvedValue({
        ...mockRating,
        score: 3,
        comment: '수정된 코멘트',
      });

      const result = await controller.ratePost(boardId, updateDto, mockUser);

      expect(result.score).toBe(3);
      expect(result.comment).toBe('수정된 코멘트');
      expect(service.ratePost).toHaveBeenCalledWith(
        boardId,
        updateDto,
        mockUser.userId,
      );
    });

    it('✅ 다양한 별점 값 (1~5)', async () => {
      for (let score = 1; score <= 5; score++) {
        const dto: RatePostDto = { rating: score, comment: `${score}점 평가` };
        mockRatingService.ratePost.mockResolvedValue({
          ...mockRating,
          score,
          comment: `${score}점 평가`,
        });

        const result = await controller.ratePost(boardId, dto, mockUser);

        expect(result.score).toBe(score);
        expect(result.comment).toBe(`${score}점 평가`);
      }

      expect(service.ratePost).toHaveBeenCalledTimes(5);
    });

    it('❌ 존재하지 않는 게시글에 별점 - NotFoundException', async () => {
      mockRatingService.ratePost.mockRejectedValue(
        new NotFoundException('ID가 999인 게시글을 찾을 수 없습니다.'),
      );

      await expect(
        controller.ratePost(999, ratePostDto, mockUser),
      ).rejects.toThrow(NotFoundException);
    });

    it('✅ boardId를 숫자로 변환 (ParseIntPipe)', async () => {
      mockRatingService.ratePost.mockResolvedValue(mockRating);

      // 컨트롤러는 ParseIntPipe를 통해 문자열을 숫자로 변환
      await controller.ratePost(boardId, ratePostDto, mockUser);

      expect(service.ratePost).toHaveBeenCalledWith(
        expect.any(Number),
        ratePostDto,
        mockUser.userId,
      );
    });
  });

  describe('GET /api/v1/boards/:boardId/rating - 평균 별점 조회', () => {
    const boardId = 1;

    it('✅ 평균 별점 조회 성공 (로그인 불필요)', async () => {
      const averageRatingData = {
        averageRating: 4.5,
        ratingCount: 10,
      };
      mockRatingService.getAverageRating.mockResolvedValue(averageRatingData);

      const result = await controller.getAverageRating(boardId);

      expect(result).toEqual(averageRatingData);
      expect(result.averageRating).toBe(4.5);
      expect(result.ratingCount).toBe(10);
      expect(service.getAverageRating).toHaveBeenCalledWith(boardId);
    });

    it('✅ 별점이 없는 게시글 (0점, 0개)', async () => {
      mockRatingService.getAverageRating.mockResolvedValue({
        averageRating: 0,
        ratingCount: 0,
      });

      const result = await controller.getAverageRating(boardId);

      expect(result.averageRating).toBe(0);
      expect(result.ratingCount).toBe(0);
    });

    it('✅ 다양한 평균 별점 값', async () => {
      const testCases = [
        { averageRating: 5.0, ratingCount: 1 },
        { averageRating: 3.7, ratingCount: 23 },
        { averageRating: 2.5, ratingCount: 50 },
        { averageRating: 4.9, ratingCount: 100 },
      ];

      for (const testCase of testCases) {
        mockRatingService.getAverageRating.mockResolvedValue(testCase);
        const result = await controller.getAverageRating(boardId);
        expect(result).toEqual(testCase);
      }
    });

    it('❌ 존재하지 않는 게시글 - NotFoundException', async () => {
      mockRatingService.getAverageRating.mockRejectedValue(
        new NotFoundException('ID가 999인 게시글을 찾을 수 없습니다.'),
      );

      await expect(controller.getAverageRating(999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('✅ Guard가 없어 인증 불필요 (메타데이터 확인)', () => {
      const metadata = Reflect.getMetadata(
        '__guards__',
        controller.getAverageRating,
      );
      expect(metadata).toBeUndefined();
    });
  });

  describe('GET /api/v1/boards/:boardId/rating/my - 내가 준 별점 조회', () => {
    const boardId = 1;

    it('✅ 내가 준 별점 조회 성공', async () => {
      mockRatingService.getMyRating.mockResolvedValue({ 
        rating: 5,
        comment: '정말 유익한 게시글입니다!'
      });

      const result = await controller.getMyRating(boardId, mockUser);

      expect(result).toEqual({ 
        rating: 5,
        comment: '정말 유익한 게시글입니다!'
      });
      expect(service.getMyRating).toHaveBeenCalledWith(
        boardId,
        mockUser.userId,
      );
    });

    it('✅ 별점을 주지 않은 경우 (null 반환)', async () => {
      mockRatingService.getMyRating.mockResolvedValue({ 
        rating: null,
        comment: null
      });

      const result = await controller.getMyRating(boardId, mockUser);

      expect(result.rating).toBeNull();
      expect(result.comment).toBeNull();
      expect(service.getMyRating).toHaveBeenCalledWith(
        boardId,
        mockUser.userId,
      );
    });

    it('✅ ADMIN도 본인 별점 조회 가능', async () => {
      mockRatingService.getMyRating.mockResolvedValue({ 
        rating: 4,
        comment: 'ADMIN의 코멘트'
      });

      const result = await controller.getMyRating(boardId, mockAdmin);

      expect(result.rating).toBe(4);
      expect(result.comment).toBe('ADMIN의 코멘트');
      expect(service.getMyRating).toHaveBeenCalledWith(
        boardId,
        mockAdmin.userId,
      );
    });

    it('✅ 다른 유저의 별점은 조회 불가 (본인 별점만 반환)', async () => {
      const user1 = { ...mockUser, userId: 'user-1' };
      const user2 = { ...mockUser, userId: 'user-2' };

      // user1의 별점 조회
      mockRatingService.getMyRating.mockResolvedValue({ 
        rating: 5,
        comment: 'user1의 코멘트'
      });
      const result1 = await controller.getMyRating(boardId, user1);
      expect(service.getMyRating).toHaveBeenCalledWith(boardId, 'user-1');

      // user2의 별점 조회 (다른 결과)
      mockRatingService.getMyRating.mockResolvedValue({ 
        rating: null,
        comment: null
      });
      const result2 = await controller.getMyRating(boardId, user2);
      expect(service.getMyRating).toHaveBeenCalledWith(boardId, 'user-2');
    });

    it('❌ 존재하지 않는 게시글 - NotFoundException', async () => {
      mockRatingService.getMyRating.mockRejectedValue(
        new NotFoundException('ID가 999인 게시글을 찾을 수 없습니다.'),
      );

      await expect(controller.getMyRating(999, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('DELETE /api/v1/boards/:boardId/rating - 별점 삭제', () => {
    const boardId = 1;

    it('✅ 본인 별점 삭제 성공', async () => {
      mockRatingService.deleteRating.mockResolvedValue(undefined);

      const result = await controller.deleteRating(boardId, mockUser);

      expect(result).toBeUndefined();
      expect(service.deleteRating).toHaveBeenCalledWith(
        boardId,
        mockUser.userId,
      );
      expect(service.deleteRating).toHaveBeenCalledTimes(1);
    });

    it('✅ ADMIN도 본인 별점만 삭제 가능', async () => {
      mockRatingService.deleteRating.mockResolvedValue(undefined);

      await controller.deleteRating(boardId, mockAdmin);

      // role이 파라미터로 전달되지 않음 (본인 것만 삭제)
      expect(service.deleteRating).toHaveBeenCalledWith(
        boardId,
        mockAdmin.userId,
      );
      expect(service.deleteRating).not.toHaveBeenCalledWith(
        boardId,
        mockAdmin.userId,
        'ADMIN',
      );
    });

    it('✅ void 반환 (HttpCode 204)', async () => {
      mockRatingService.deleteRating.mockResolvedValue(undefined);

      const result = await controller.deleteRating(boardId, mockUser);

      expect(result).toBeUndefined();
    });

    it('❌ 존재하지 않는 게시글 - NotFoundException', async () => {
      mockRatingService.deleteRating.mockRejectedValue(
        new NotFoundException('ID가 999인 게시글을 찾을 수 없습니다.'),
      );

      await expect(controller.deleteRating(999, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('❌ 본인이 준 별점이 없는 경우 - NotFoundException', async () => {
      mockRatingService.deleteRating.mockRejectedValue(
        new NotFoundException('해당 게시글에 대한 별점을 찾을 수 없습니다.'),
      );

      await expect(controller.deleteRating(boardId, mockUser)).rejects.toThrow(
        NotFoundException,
      );
      await expect(controller.deleteRating(boardId, mockUser)).rejects.toThrow(
        '해당 게시글에 대한 별점을 찾을 수 없습니다.',
      );
    });
  });

  describe('통합 시나리오 테스트', () => {
    it('✅ 전체 플로우: 별점 생성 → 조회 → 수정 → 삭제', async () => {
      const boardId = 1;

      // 1. 별점 생성 (5점)
      mockRatingService.ratePost.mockResolvedValue({
        ...mockRating,
        score: 5,
      });
      const created = await controller.ratePost(
        boardId,
        { rating: 5 },
        mockUser,
      );
      expect(created.score).toBe(5);

      // 2. 내 별점 조회
      mockRatingService.getMyRating.mockResolvedValue({ 
        rating: 5,
        comment: '정말 유익한 게시글입니다!'
      });
      const myRating = await controller.getMyRating(boardId, mockUser);
      expect(myRating.rating).toBe(5);
      expect(myRating.comment).toBe('정말 유익한 게시글입니다!');

      // 3. 평균 별점 조회
      mockRatingService.getAverageRating.mockResolvedValue({
        averageRating: 5.0,
        ratingCount: 1,
      });
      const average = await controller.getAverageRating(boardId);
      expect(average.averageRating).toBe(5.0);

      // 4. 별점 수정 (3점)
      mockRatingService.ratePost.mockResolvedValue({
        ...mockRating,
        score: 3,
        comment: '수정된 코멘트',
      });
      const updated = await controller.ratePost(
        boardId,
        { rating: 3, comment: '수정된 코멘트' },
        mockUser,
      );
      expect(updated.score).toBe(3);
      expect(updated.comment).toBe('수정된 코멘트');

      // 5. 별점 삭제
      mockRatingService.deleteRating.mockResolvedValue(undefined);
      await controller.deleteRating(boardId, mockUser);
      expect(service.deleteRating).toHaveBeenCalled();
    });

    it('✅ 여러 유저가 별점 주는 시나리오', async () => {
      const boardId = 1;
      const user1 = { ...mockUser, userId: 'user-1' };
      const user2 = { ...mockUser, userId: 'user-2' };
      const user3 = { ...mockUser, userId: 'user-3' };

      // user1: 5점
      mockRatingService.ratePost.mockResolvedValue({
        ...mockRating,
        userId: 'user-1',
        score: 5,
      });
      await controller.ratePost(boardId, { rating: 5 }, user1);

      // user2: 4점
      mockRatingService.ratePost.mockResolvedValue({
        ...mockRating,
        userId: 'user-2',
        score: 4,
      });
      await controller.ratePost(boardId, { rating: 4 }, user2);

      // user3: 3점
      mockRatingService.ratePost.mockResolvedValue({
        ...mockRating,
        userId: 'user-3',
        score: 3,
      });
      await controller.ratePost(boardId, { rating: 3 }, user3);

      // 평균 별점: (5+4+3)/3 = 4.0
      mockRatingService.getAverageRating.mockResolvedValue({
        averageRating: 4.0,
        ratingCount: 3,
      });
      const average = await controller.getAverageRating(boardId);
      expect(average.averageRating).toBe(4.0);
      expect(average.ratingCount).toBe(3);
    });

    it('✅ USER와 ADMIN 권한 차이 확인', async () => {
      const boardId = 1;

      // USER: 별점 생성
      mockRatingService.ratePost.mockResolvedValue(mockRating);
      await controller.ratePost(boardId, { rating: 5 }, mockUser);
      expect(service.ratePost).toHaveBeenCalledWith(
        boardId,
        { rating: 5 },
        mockUser.userId,
      );

      // ADMIN: 별점 생성 (동일한 방식)
      mockRatingService.ratePost.mockResolvedValue({
        ...mockRating,
        userId: mockAdmin.userId,
      });
      await controller.ratePost(boardId, { rating: 5 }, mockAdmin);
      expect(service.ratePost).toHaveBeenCalledWith(
        boardId,
        { rating: 5 },
        mockAdmin.userId,
      );

      // 삭제도 동일 (본인 것만)
      mockRatingService.deleteRating.mockResolvedValue(undefined);
      await controller.deleteRating(boardId, mockAdmin);
      expect(service.deleteRating).toHaveBeenCalledWith(
        boardId,
        mockAdmin.userId,
      );
    });

    it('✅ 공개 API와 인증 API 구분', async () => {
      const boardId = 1;

      // 공개 API: 평균 별점 조회 (인증 불필요)
      mockRatingService.getAverageRating.mockResolvedValue({
        averageRating: 4.5,
        ratingCount: 10,
      });
      const publicData = await controller.getAverageRating(boardId);
      expect(publicData).toBeDefined();

      // 인증 필요 API는 user 객체 필요
      // (실제로는 Guard가 처리하지만, 컨트롤러는 user 파라미터를 받음)
      mockRatingService.getMyRating.mockResolvedValue({ rating: 5 });
      await expect(
        controller.getMyRating(boardId, mockUser),
      ).resolves.toBeDefined();
    });
  });

  describe('엣지 케이스 테스트', () => {
    it('✅ boardId가 0인 경우', async () => {
      mockRatingService.getAverageRating.mockResolvedValue({
        averageRating: 0,
        ratingCount: 0,
      });

      const result = await controller.getAverageRating(0);
      expect(service.getAverageRating).toHaveBeenCalledWith(0);
    });

    it('✅ 매우 큰 boardId', async () => {
      const largeId = 999999999;
      mockRatingService.getAverageRating.mockResolvedValue({
        averageRating: 0,
        ratingCount: 0,
      });

      await controller.getAverageRating(largeId);
      expect(service.getAverageRating).toHaveBeenCalledWith(largeId);
    });

    it('✅ 별점 1점 (최소값)', async () => {
      mockRatingService.ratePost.mockResolvedValue({
        ...mockRating,
        score: 1,
      });

      const result = await controller.ratePost(1, { rating: 1 }, mockUser);
      expect(result.score).toBe(1);
    });

    it('✅ 별점 5점 (최대값)', async () => {
      mockRatingService.ratePost.mockResolvedValue({
        ...mockRating,
        score: 5,
      });

      const result = await controller.ratePost(1, { rating: 5 }, mockUser);
      expect(result.score).toBe(5);
    });
  });
});
