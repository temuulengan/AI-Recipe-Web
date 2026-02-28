import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreatePostDto } from './create-post.dto';

export class UpdatePostDto extends PartialType(CreatePostDto) {
    @IsOptional()
    @IsBoolean({ message: 'isPinned는 boolean 값이어야 합니다.' })
    isPinned?: boolean;
}
