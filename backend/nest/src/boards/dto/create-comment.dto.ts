import { IsString, IsNotEmpty, MaxLength, IsOptional, IsNumber } from 'class-validator';

export class CreateCommentDto {
  @IsString({ message: '댓글 내용은 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '댓글 내용은 필수입니다.' })
  @MaxLength(1000, { message: '댓글은 최대 1000자까지 입력 가능합니다.' })
  content!: string;

  @IsOptional()
  @IsNumber({}, { message: '부모 댓글 ID는 숫자여야 합니다.' })
  parentId?: number;
}
