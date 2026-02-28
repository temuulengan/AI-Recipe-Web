import { Injectable, NotFoundException, ForbiddenException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  /**
   * 전체 유저 목록 조회
   * @returns 모든 유저 배열 (비밀번호 제외)
   */
  async findAll(): Promise<User[]> {
    return await this.usersRepo.find({
      select: [
        'id',
        'user_id',
        'username',
        'nickname',
        'email',
        'role',
        'llm_count',
        'last_login_at',
        'created_at',
        'updated_at',
      ],
      order: {
        created_at: 'DESC', // 최신 가입자부터
      },
    });
  }

  /**
   * 특정 유저 상세 조회
   * @param id - 유저 PK
   * @returns 유저 정보 (비밀번호 제외)
   */
  async findOne(id: string): Promise<User> {
    const user = await this.usersRepo.findOne({
      where: { id },
      select: [
        'id',
        'user_id',
        'username',
        'nickname',
        'email',
        'role',
        'llm_count',
        'last_login_at',
        'created_at',
        'updated_at',
      ],
    });

    if (!user) {
      throw new NotFoundException(`ID가 ${id}인 유저를 찾을 수 없습니다.`);
    }

    return user;
  }

  /**
   * user_id로 유저 조회
   * @param userId - 로그인 아이디
   * @returns 유저 정보 (비밀번호 제외)
   */
  async findByUserId(userId: string): Promise<User> {
    const user = await this.usersRepo.findOne({
      where: { user_id: userId },
      select: [
        'id',
        'user_id',
        'username',
        'nickname',
        'email',
        'role',
        'last_login_at',
        'created_at',
        'updated_at',
      ],
    });

    if (!user) {
      throw new NotFoundException(`user_id가 ${userId}인 유저를 찾을 수 없습니다.`);
    }

    return user;
  }

  /**
   * 유저 정보 수정
   * @param id - 유저 PK
   * @param updateUserDto - 수정할 정보
   * @param currentUserId - 현재 로그인한 유저의 ID
   * @param currentUserRole - 현재 로그인한 유저의 역할
   * @returns 수정된 유저 정보
   */
  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    currentUserId: string,
    currentUserRole: string,
  ): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`ID가 ${id}인 유저를 찾을 수 없습니다.`);
    }

    // 본인 또는 ADMIN만 수정 가능
    if (currentUserId !== id && currentUserRole !== 'ADMIN') {
      throw new ForbiddenException('본인 또는 관리자만 수정할 수 있습니다.');
    }

    // 이메일 중복 검사 (다른 유저가 이미 사용 중인 경우)
    if (updateUserDto.email) {
      const existingUser = await this.usersRepo.findOne({
        where: {
          email: updateUserDto.email,
          id: Not(id),
        },
      });

      if (existingUser) {
        throw new ConflictException('이미 사용 중인 이메일입니다.');
      }
    }

    // 수정 사항 적용
    Object.assign(user, updateUserDto);

    const updated = await this.usersRepo.save(user);

    // 비밀번호 제외하고 반환
    const { password, ...result } = updated;
    return result as User;
  }

  /**
   * 비밀번호 변경
   * @param id - 유저 PK
   * @param updatePasswordDto - 비밀번호 변경 정보
   * @param currentUserId - 현재 로그인한 유저의 ID
   */
  async updatePassword(
    id: string,
    updatePasswordDto: UpdatePasswordDto,
    currentUserId: string,
  ): Promise<void> {
    // 본인만 비밀번호 변경 가능 (관리자도 타인의 비밀번호는 변경 불가)
    if (currentUserId !== id) {
      throw new ForbiddenException('본인의 비밀번호만 변경할 수 있습니다.');
    }

    const user = await this.usersRepo.findOne({
      where: { id },
      select: ['id', 'password'],
    });

    if (!user) {
      throw new NotFoundException(`ID가 ${id}인 유저를 찾을 수 없습니다.`);
    }

    // 현재 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(
      updatePasswordDto.currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('현재 비밀번호가 일치하지 않습니다.');
    }

    // 새 비밀번호와 확인 비밀번호 일치 확인
    if (updatePasswordDto.newPassword !== updatePasswordDto.confirmPassword) {
      throw new ConflictException('새 비밀번호와 확인 비밀번호가 일치하지 않습니다.');
    }

    // 새 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(updatePasswordDto.newPassword, 12);
    user.password = hashedPassword;

    await this.usersRepo.save(user);
  }

  /**
   * 유저 삭제
   * @param id - 유저 PK
   * @param currentUserId - 현재 로그인한 유저의 ID
   * @param currentUserRole - 현재 로그인한 유저의 역할
   */
  async remove(
    id: string,
    currentUserId: string,
    currentUserRole: string,
  ): Promise<void> {
    const user = await this.usersRepo.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`ID가 ${id}인 유저를 찾을 수 없습니다.`);
    }

    // 본인 또는 ADMIN만 삭제 가능
    if (currentUserId !== id && currentUserRole !== 'ADMIN') {
      throw new ForbiddenException('본인 또는 관리자만 삭제할 수 있습니다.');
    }

    await this.usersRepo.remove(user);
  }
}
