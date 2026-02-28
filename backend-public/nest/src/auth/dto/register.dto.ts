import { IsEmail, IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty({ message: 'user_id는 필수 항목입니다.' })
  @IsString()
  @MinLength(3, { message: 'user_id는 최소 3자 이상이어야 합니다.' })
  user_id!: string;

  @IsNotEmpty({ message: 'email은 필수 항목입니다.' })
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  email!: string;

  @IsNotEmpty({ message: 'password는 필수 항목입니다.' })
  @IsString()
  @MinLength(8, { message: 'password는 최소 8자 이상이어야 합니다.' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#+\-_.,;:~^])[A-Za-z\d@$!%*?&#+\-_.,;:~^]/,
    { message: 'password는 대문자, 소문자, 숫자, 특수문자를 포함해야 합니다.' }
  )
  password!: string;

  @IsNotEmpty({ message: 'username은 필수 항목입니다.' })
  @IsString()
  @MinLength(2, { message: 'username은 최소 2자 이상이어야 합니다.' })
  username!: string;

  @IsNotEmpty({ message: 'nickname은 필수 항목입니다.' })
  @IsString()
  @MinLength(2, { message: 'nickname은 최소 2자 이상이어야 합니다.' })
  nickname!: string;
}

export class RegisterResponseDto {
  id!: string;
  user_id!: string;
  username!: string;
  email!: string;
  nickname!: string;
  createdAt!: string;
  message!: string;

  constructor(partial: Partial<RegisterResponseDto>) {
    Object.assign(this, partial);
    this.message = '회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.';
  }
}
