import { IsOptional, IsString, IsInt, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class GetPostsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '페이지는 정수여야 합니다.' })
  @Min(1, { message: '페이지는 1 이상이어야 합니다.' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit는 정수여야 합니다.' })
  @Min(1, { message: 'limit는 1 이상이어야 합니다.' })
  limit?: number = 20;

  @IsOptional()
  @IsString({ message: '검색어는 문자열이어야 합니다.' })
  search?: string;

  @IsOptional()
  @IsString({ message: 'Prefix filter must be a string.' })
  @IsIn(['General', 'Notice', 'Recipe', 'Question', 'Tip'], {
    message: 'Prefix must be one of: General, Notice, Recipe, Question, Tip.',
  })
  prefix?: string;

  @IsOptional()
  @IsString({ message: '정렬 기준은 문자열이어야 합니다.' })
  @IsIn(['recent', 'views', 'rating', 'comments'], {
    message: '정렬 기준은 recent, views, rating, comments 중 하나여야 합니다.',
  })
  sortBy?: string = 'recent';
}
