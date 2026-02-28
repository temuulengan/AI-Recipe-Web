import {
  Controller,
  Get,
  Put,
  Patch,
  Delete,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('/api/v1/me')
@UseGuards(JwtAuthGuard) // JWT 인증만 필요 (본인 정보이므로 Role 체크 불필요)
export class MeController {
  constructor(private readonly usersService: UsersService) { }

  /**
   * 내 정보 조회
   * GET /api/v1/me
   * @param user - 현재 로그인한 유저 정보
   * @returns 본인의 상세 정보
   */
  @Get()
  async getMe(
    @CurrentUser() user: { userId: string; username: string; role: string },
  ): Promise<User> {
    return await this.usersService.findOne(user.userId);
  }

  /**
   * 내 정보 수정
   * PUT /api/v1/me
   * @param updateUserDto - 수정할 정보
   * @param user - 현재 로그인한 유저 정보
   * @returns 수정된 본인 정보
   */
  @Patch()
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async updateMe(
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: { userId: string; username: string; role: string },
  ): Promise<User> {
    return await this.usersService.update(
      user.userId,
      updateUserDto,
      user.userId,
      user.role,
    );
  }

  /**
   * 비밀번호 변경
   * PUT /api/v1/me/password
   * @param updatePasswordDto - 비밀번호 변경 정보
   * @param user - 현재 로그인한 유저 정보
   */
  @Put('password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async updatePassword(
    @Body() updatePasswordDto: UpdatePasswordDto,
    @CurrentUser() user: { userId: string; username: string; role: string },
  ): Promise<void> {
    await this.usersService.updatePassword(
      user.userId,
      updatePasswordDto,
      user.userId,
    );
  }

  /**
   * 내 계정 삭제 (회원 탈퇴)
   * DELETE /api/v1/me
   * @param user - 현재 로그인한 유저 정보
   */
  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMe(
    @CurrentUser() user: { userId: string; username: string; role: string },
  ): Promise<void> {
    await this.usersService.remove(user.userId, user.userId, user.role);
  }
}
