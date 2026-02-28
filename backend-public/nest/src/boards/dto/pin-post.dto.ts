import { IsBoolean } from 'class-validator';

export class PinPostDto {
  @IsBoolean({ message: 'isPinned는 boolean 값이어야 합니다.' })
  isPinned!: boolean;
}
