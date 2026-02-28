import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
  Put,
  Delete,
  Body,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('/api/v1/admin/users')
@UseGuards(JwtAuthGuard, RolesGuard) // JWT 인증 + Role 검증
@Roles('ADMIN') // 전체 컨트롤러 ADMIN 전용
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) { }

  /**
   * 전체 유저 목록 조회 (Admin 전용)
   * GET /api/v1/users
   * @returns 모든 유저 배열
   */
  @Get()
  async findAll(): Promise<User[]> {
    return await this.usersService.findAll();
  }

  /**
   * 특정 유저 상세 조회 (Admin 전용)
   * GET /api/v1/users/:id
   * @param id - 유저 PK
   * @returns 유저 상세 정보
   */
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<User> {
    return await this.usersService.findOne(id);
  }

  /**
   * 유저 정보 수정 (Admin 전용)
   * PUT /api/v1/users/:id
   * @param id - 유저 PK
   * @param updateUserDto - 수정할 정보
   * @returns 수정된 유저 정보
   */
  @Put(':id')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    // ADMIN은 모든 유저 수정 가능 (currentUserId는 의미 없음, role은 ADMIN 확정)
    return await this.usersService.update(id, updateUserDto, id, 'ADMIN');
  }

  /**
   * 유저 삭제 (Admin 전용)
   * DELETE /api/v1/users/:id
   * @param id - 유저 PK
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    // ADMIN은 모든 유저 삭제 가능
    await this.usersService.remove(id, id, 'ADMIN');
  }
}
