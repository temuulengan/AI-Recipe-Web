import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class LoginDto {
  @IsNotEmpty({ message: 'user_id는 필수 항목입니다.' })
  @IsString()
  @MinLength(3, { message: 'user_id는 최소 3자 이상이어야 합니다.' })
  user_id!: string;

  @IsNotEmpty({ message: 'password는 필수 항목입니다.' })
  @MinLength(8, { message: 'password는 최소 8자 이상이어야 합니다.' })
  password!: string;
}
