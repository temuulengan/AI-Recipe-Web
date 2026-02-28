import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsIn,
} from 'class-validator';

export class CreatePostDto {
  @IsString({ message: '제목은 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '제목은 필수입니다.' })
  @MaxLength(200, { message: '제목은 최대 200자까지 입력 가능합니다.' })
  title!: string;

  @IsString({ message: '본문은 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '본문은 필수입니다.' })
  content!: string;

  @IsOptional()
  @IsString({ message: 'Prefix must be a string.' })
  @IsIn(['General', 'Notice', 'Recipe', 'Question', 'Tip'], {
    message: 'Prefix must be one of: General, Notice, Recipe, Question, Tip.',
  })
  prefix?: string = 'General';
}
