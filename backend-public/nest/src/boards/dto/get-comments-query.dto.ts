import { IsOptional, IsInt, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class GetCommentsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '페이지는 정수여야 합니다.' })
  @Min(1, { message: '페이지는 1 이상이어야 합니다.' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit는 정수여야 합니다.' })
  @Min(1, { message: 'limit는 1 이상이어야 합니다.' })
  limit?: number = 50;

  @IsOptional()
  @IsIn(['oldest', 'newest'], {
    message: '정렬 기준은 oldest, newest 중 하나여야 합니다.',
  })
  sortBy?: string = 'oldest';
}
