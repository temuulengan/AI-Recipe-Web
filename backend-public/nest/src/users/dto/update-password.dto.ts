import { IsString, MinLength, Matches } from 'class-validator';

export class UpdatePasswordDto {
  @IsString({ message: '현재 비밀번호는 문자열이어야 합니다.' })
  @MinLength(8, { message: '현재 비밀번호는 최소 8자 이상이어야 합니다.' })
  currentPassword!: string;

  @IsString({ message: '새 비밀번호는 문자열이어야 합니다.' })
  @MinLength(8, { message: '새 비밀번호는 최소 8자 이상이어야 합니다.' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    {
      message:
        '비밀번호는 대소문자, 숫자, 특수문자를 포함해야 합니다.',
    },
  )
  newPassword!: string;

  @IsString({ message: '비밀번호 확인은 문자열이어야 합니다.' })
  @MinLength(8, { message: '비밀번호 확인은 최소 8자 이상이어야 합니다.' })
  confirmPassword!: string;
}
