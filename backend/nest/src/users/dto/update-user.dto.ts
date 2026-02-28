import { IsString, IsEmail, IsOptional, MinLength } from 'class-validator';

/**
 * 유저 기본 정보 수정 DTO
 * 
 * 수정 가능 필드:
 * - username (사용자 이름)
 * - nickname (닉네임)
 * - email (이메일)
 * 
 * 수정 불가 필드:
 * - user_id (로그인 아이디) - 생성 시에만 설정
 * - role (역할) - ADMIN만 수정 가능
 * - password (비밀번호) - 별도 엔드포인트 사용
 * - created_at, updated_at, last_login_at - 자동 관리
 */
export class UpdateUserDto {
  @IsOptional()
  @IsString({ message: 'username은 문자열이어야 합니다.' })
  @MinLength(2, { message: 'username은 최소 2자 이상이어야 합니다.' })
  username?: string;

  @IsOptional()
  @IsString({ message: 'nickname은 문자열이어야 합니다.' })
  @MinLength(2, { message: 'nickname은 최소 2자 이상이어야 합니다.' })
  nickname?: string;

  @IsOptional()
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  email?: string;
}
