import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { User } from '../users/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload, SanitizedUser } from './types';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(RefreshToken) private readonly refreshTokenRepo: Repository<RefreshToken>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) { }

  private sanitize(user: User): SanitizedUser {
    const { id, user_id, username, nickname, email, role, llm_count, last_login_at, created_at, updated_at } = user;
    return { id, user_id, username, nickname, email, role, llm_count, last_login_at, created_at, updated_at };
  }

  async register(dto: RegisterDto) {
    // user_id / email 중복검사
    const [byUserId, byEmail] = await Promise.all([
      this.usersRepo.findOne({ where: { user_id: dto.user_id } }),
      this.usersRepo.findOne({ where: { email: dto.email } }),
    ]);

    if (byUserId) throw new ConflictException('이미 있는 아이디입니다.');
    if (byEmail) throw new ConflictException('이미 있는 이메일입니다.');

    const saltRounds = Number(this.config.get('BCRYPT_SALT_ROUNDS') ?? 12);
    const hashed = await bcrypt.hash(dto.password, saltRounds);

    const entity = this.usersRepo.create({
      user_id: dto.user_id,
      username: dto.username,
      nickname: dto.nickname,
      email: dto.email,
      password: hashed,
      role: 'USER', // 기본값
    });

    const saved = await this.usersRepo.save(entity);

    const { accessToken, refreshToken, accessTokenExpiresIn } = await this.generateTokens(saved);

    return {
      user: this.sanitize(saved),
      accessToken,
      refreshToken,
      accessTokenExpiresIn,
    };
  }

  async validateUser(userId: string, password: string) {
    const user = await this.usersRepo
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.user_id = :user_id', { user_id: userId })
      .getOne();

    if (!user) throw new UnauthorizedException('invalid credentials');

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw new UnauthorizedException('invalid credentials');

    return user;
  }

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.user_id, dto.password);

    // 마지막 로그인 시간 업데이트
    await this.usersRepo.update(user.id, { last_login_at: new Date() });
    user.last_login_at = new Date();

    const { accessToken, refreshToken, accessTokenExpiresIn } = await this.generateTokens(user);

    return {
      user: this.sanitize(user),
      accessToken,
      refreshToken,
      accessTokenExpiresIn,
    };
  }

  /**
   * Access Token과 Refresh Token 생성
   */
  private async generateTokens(user: User) {
    const payload: JwtPayload = { sub: user.id, username: user.username, role: user.role };

    // Access Token (15분)
    const accessTokenExpiresIn = 900; // 15분 (초 단위)
    const accessToken = await this.jwt.signAsync(payload, {
      expiresIn: accessTokenExpiresIn,
    });

    // Refresh Token (7일)
    const refreshTokenExpiresIn = 7 * 24 * 60 * 60; // 7일 (초 단위)
    const refreshToken = await this.jwt.signAsync(payload, {
      expiresIn: refreshTokenExpiresIn,
    });

    // Refresh Token DB 저장 (해시)
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + refreshTokenExpiresIn);

    // Refresh Token을 해시해서 저장 (보안 강화)
    const hashedToken = await bcrypt.hash(refreshToken, 10);

    const refreshTokenEntity = this.refreshTokenRepo.create({
      userId: user.id,
      token: hashedToken,  // 해시된 토큰 저장
      expiresAt,
    });
    await this.refreshTokenRepo.save(refreshTokenEntity);

    return { accessToken, refreshToken, accessTokenExpiresIn };
  }

  /**
   * Refresh Token으로 Access Token 재발급
   */
  async refresh(refreshToken: string) {
    // 1. Refresh Token 검증
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync(refreshToken);
    } catch (error) {
      throw new UnauthorizedException('유효하지 않은 refresh token입니다.');
    }

    // 2. DB에서 Refresh Token 확인
    // 해시 저장이므로 userId로만 조회
    const storedTokens = await this.refreshTokenRepo.find({
      where: { userId: payload.sub, isRevoked: false },
    });

    // 해시 비교로 일치하는 토큰 찾기
    let validToken = null;
    for (const stored of storedTokens) {
      const isMatch = await bcrypt.compare(refreshToken, stored.token);
      if (isMatch) {
        validToken = stored;
        break;
      }
    }

    if (!validToken) {
      throw new UnauthorizedException('refresh token을 찾을 수 없습니다.');
    }

    if (validToken.isRevoked) {
      throw new UnauthorizedException('폐기된 refresh token입니다.');
    }

    if (validToken.expiresAt < new Date()) {
      throw new UnauthorizedException('만료된 refresh token입니다.');
    }

    // 3. 새로운 Access Token 발급
    const user = await this.usersRepo.findOne({ where: { id: payload.sub } });
    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }

    const newPayload: JwtPayload = { sub: user.id, username: user.username, role: user.role };
    const accessTokenExpiresIn = 900; // 15분
    const accessToken = await this.jwt.signAsync(newPayload, {
      expiresIn: accessTokenExpiresIn,
    });

    return { accessToken, accessTokenExpiresIn };
  }

  /**
   * 로그아웃 - Refresh Token 폐기
   */
  async logout(refreshToken: string, userId: string): Promise<void> {
    // 해시 저장이므로 userId로 조회 후 비교
    const storedTokens = await this.refreshTokenRepo.find({
      where: { userId, isRevoked: false },
    });

    // 해시 비교로 일치하는 토큰 찾기
    let validToken = null;
    for (const stored of storedTokens) {
      const isMatch = await bcrypt.compare(refreshToken, stored.token);
      if (isMatch) {
        validToken = stored;
        break;
      }
    }

    if (!validToken) {
      throw new UnauthorizedException('refresh token을 찾을 수 없습니다.');
    }

    // Refresh Token 폐기
    await this.refreshTokenRepo.update(validToken.id, { isRevoked: true });
  }

  /**
   * 내 프로필 조회 (토큰 유효성 확인)
   */
  async getProfile(userId: string): Promise<SanitizedUser> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }
    return this.sanitize(user);
  }
}
