import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostRating } from './entities/post-rating.entity';
import { Post } from './entities/post.entity';
import { RatePostDto } from './dto/rate-post.dto';

@Injectable()
export class RatingService {
  constructor(
    @InjectRepository(PostRating)
    private readonly ratingsRepository: Repository<PostRating>,
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
  ) {}

  /**
   * 별점 주기 또는 수정하기 (Upsert)
   * - 이미 별점을 준 경우: 별점 수정
   * - 처음 별점을 주는 경우: 별점 생성
   */
  async ratePost(
    boardId: number,
    ratePostDto: RatePostDto,
    userId: string,
  ): Promise<PostRating> {
    // 1. 게시글 존재 여부 확인
    const post = await this.postsRepository.findOne({ where: { id: boardId } });
    if (!post) {
      throw new NotFoundException(`ID가 ${boardId}인 게시글을 찾을 수 없습니다.`);
    }

    // 2. 기존 별점 조회
    const existingRating = await this.ratingsRepository.findOne({
      where: { postId: boardId, userId },
    });

    if (existingRating) {
      // 별점 수정
      const oldScore = existingRating.score;
      existingRating.score = ratePostDto.rating;
      existingRating.comment = ratePostDto.comment;
      const updatedRating = await this.ratingsRepository.save(existingRating);

      // 게시글의 평균 별점 업데이트
      await this.updatePostRatingStats(boardId);

      return updatedRating;
    } else {
      // 별점 생성
      const newRating = this.ratingsRepository.create({
        postId: boardId,
        userId,
        score: ratePostDto.rating,
        comment: ratePostDto.comment,
      });
      const savedRating = await this.ratingsRepository.save(newRating);

      // 게시글의 평균 별점 및 카운트 업데이트
      await this.updatePostRatingStats(boardId);

      return savedRating;
    }
  }

  /**
   * 평균 별점 조회 (공개 - 로그인 불필요)
   */
  async getAverageRating(boardId: number): Promise<{
    averageRating: number;
    ratingCount: number;
  }> {
    // 게시글 존재 여부 확인
    const post = await this.postsRepository.findOne({
      where: { id: boardId },
      select: ['id', 'averageRating', 'ratingCount'],
    });

    if (!post) {
      throw new NotFoundException(`ID가 ${boardId}인 게시글을 찾을 수 없습니다.`);
    }

    return {
      averageRating: post.averageRating || 0,
      ratingCount: post.ratingCount || 0,
    };
  }

  /**
   * 내가 준 별점 조회 (로그인 필요)
   */
  async getMyRating(
    boardId: number,
    userId: string,
  ): Promise<{ rating: number | null; comment: string | null }> {
    // 게시글 존재 여부 확인
    const post = await this.postsRepository.findOne({ where: { id: boardId } });
    if (!post) {
      throw new NotFoundException(`ID가 ${boardId}인 게시글을 찾을 수 없습니다.`);
    }

    // 내 별점 조회
    const myRating = await this.ratingsRepository.findOne({
      where: { postId: boardId, userId },
      select: ['score', 'comment'],
    });

    return {
      rating: myRating ? myRating.score : null,
      comment: myRating?.comment || null,
    };
  }

  /**
   * 모든 별점 조회 (공개 - 로그인 불필요)
   */
  async getAllRatings(boardId: number): Promise<
    Array<{
      id: number;
      score: number;
      comment: string | null;
      userId: string;
      username: string;
      createdAt: Date;
      updatedAt: Date;
    }>
  > {
    // 게시글 존재 여부 확인
    const post = await this.postsRepository.findOne({ where: { id: boardId } });
    if (!post) {
      throw new NotFoundException(`ID가 ${boardId}인 게시글을 찾을 수 없습니다.`);
    }

    // 모든 별점 조회 (사용자 정보 포함)
    const ratings = await this.ratingsRepository
      .createQueryBuilder('rating')
      .leftJoinAndSelect('rating.user', 'user')
      .where('rating.postId = :boardId', { boardId })
      .orderBy('rating.createdAt', 'DESC')
      .getMany();

    return ratings.map((rating) => ({
      id: rating.id,
      score: rating.score,
      comment: rating.comment || null,
      userId: rating.userId,
      username: rating.user.username,
      createdAt: rating.createdAt,
      updatedAt: rating.updatedAt,
    }));
  }

  /**
   * 별점 삭제 (본인 것만 삭제 가능)
   */
  async deleteRating(boardId: number, userId: string): Promise<void> {
    // 1. 게시글 존재 여부 확인
    const post = await this.postsRepository.findOne({ where: { id: boardId } });
    if (!post) {
      throw new NotFoundException(`ID가 ${boardId}인 게시글을 찾을 수 없습니다.`);
    }

    // 2. 별점 조회
    const rating = await this.ratingsRepository.findOne({
      where: { postId: boardId, userId },
    });

    if (!rating) {
      throw new NotFoundException(
        `해당 게시글에 대한 별점을 찾을 수 없습니다.`,
      );
    }

    // 3. 삭제
    await this.ratingsRepository.delete(rating.id);

    // 4. 게시글의 평균 별점 업데이트
    await this.updatePostRatingStats(boardId);
  }

  /**
   * 게시글의 평균 별점 및 개수 업데이트 (내부 헬퍼 메서드)
   */
  private async updatePostRatingStats(boardId: number): Promise<void> {
    const result = await this.ratingsRepository
      .createQueryBuilder('rating')
      .select('AVG(rating.score)', 'average')
      .addSelect('COUNT(rating.id)', 'count')
      .where('rating.postId = :boardId', { boardId })
      .getRawOne();

    const averageRating = result.average ? parseFloat(result.average) : 0;
    const ratingCount = result.count ? parseInt(result.count, 10) : 0;

    await this.postsRepository.update(boardId, {
      averageRating: averageRating,
      ratingCount: ratingCount,
    });
  }
}
