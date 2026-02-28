import { IsString, IsNotEmpty } from 'class-validator';

export class RefreshTokenDto {
  @IsString({ message: 'refresh token은 문자열이어야 합니다.' })
  @IsNotEmpty({ message: 'refresh token은 필수입니다.' })
  refreshToken!: string;
}
