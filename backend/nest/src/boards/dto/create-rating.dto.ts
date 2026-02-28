import { IsNumber, Min, Max, IsString, IsOptional } from 'class-validator';

export class CreateRatingDto {
  @IsNumber({}, { message: '별점은 숫자여야 합니다.' })
  @Min(1, { message: '별점은 최소 1점입니다.' })
  @Max(5, { message: '별점은 최대 5점입니다.' })
  rating!: number;

  @IsOptional()
  @IsString({ message: '코멘트는 문자열이어야 합니다.' })
  comment?: string;
}
