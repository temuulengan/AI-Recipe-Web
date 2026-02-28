import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { User } from '../users/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

// bcrypt mock
jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersRepo: Repository<User>;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockUsersRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockRefreshTokenRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUsersRepository,
        },
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: mockRefreshTokenRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersRepo = module.get<Repository<User>>(getRepositoryToken(User));
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      user_id: 'testuser',
      email: 'test@example.com',
      password: 'P@ssw0rd!',
      username: '홍길동',
      nickname: '흥부',
    };

    it('회원가입 성공 - 새 유저 생성 및 토큰 반환', async () => {
      const hashedPassword = 'hashed_password';
      const savedUser = {
        id: '1',
        user_id: 'testuser',
        username: '홍길동',
        nickname: '흥부',
        email: 'test@example.com',
        password: hashedPassword,
        role: 'USER',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockUsersRepository.findOne.mockResolvedValueOnce(null); // user_id 중복 확인
      mockUsersRepository.findOne.mockResolvedValueOnce(null); // email 중복 확인
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockUsersRepository.create.mockReturnValue(savedUser);
      mockUsersRepository.save.mockResolvedValue(savedUser);
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'BCRYPT_SALT_ROUNDS') return '12';
        if (key === 'JWT_SECRET') return 'test_secret';
        if (key === 'JWT_REFRESH_SECRET') return 'test_refresh_secret';
        if (key === 'JWT_EXPIRES_IN') return '1d';
        return null;
      });
      mockJwtService.signAsync
        .mockResolvedValueOnce('mock.access.token') // Access Token
        .mockResolvedValueOnce('mock.refresh.token'); // Refresh Token
      mockRefreshTokenRepository.create.mockReturnValue({
        id: 1,
        userId: savedUser.id,
        token: 'hashed_refresh_token',
        expiresAt: new Date(),
      });
      mockRefreshTokenRepository.save.mockResolvedValue({});

      const result = await service.register(registerDto);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('accessTokenExpiresIn');
      expect(result.accessToken).toBe('mock.access.token');
      expect(result.refreshToken).toBe('mock.refresh.token');
      expect(result.accessTokenExpiresIn).toBe(900); // 15분
      expect(result.user.user_id).toBe('testuser');
      expect(result.user).not.toHaveProperty('password'); // 비밀번호 제외 확인

      // 중복 확인 호출 검증
      expect(mockUsersRepository.findOne).toHaveBeenCalledTimes(2);
      expect(mockUsersRepository.findOne).toHaveBeenCalledWith({
        where: { user_id: registerDto.user_id },
      });
      expect(mockUsersRepository.findOne).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });

      // 비밀번호 해싱 검증
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 12);

      // 유저 생성 및 저장 검증
      expect(mockUsersRepository.create).toHaveBeenCalled();
      expect(mockUsersRepository.save).toHaveBeenCalled();

      // Access Token 생성 검증
      expect(mockJwtService.signAsync).toHaveBeenNthCalledWith(
        1,
        {
          sub: savedUser.id,
          username: savedUser.username,
          role: savedUser.role,
        },
        {
          expiresIn: 900, // 15분
        },
      );

      // Refresh Token 생성 검증
      expect(mockJwtService.signAsync).toHaveBeenNthCalledWith(
        2,
        {
          sub: savedUser.id,
          username: savedUser.username,
          role: savedUser.role,
        },
        {
          expiresIn: 604800, // 7일
        },
      );

      // Refresh Token DB 저장 검증
      expect(mockRefreshTokenRepository.create).toHaveBeenCalled();
      expect(mockRefreshTokenRepository.save).toHaveBeenCalled();
    });

    it('회원가입 실패 - 중복된 user_id', async () => {
      const existingUser = { id: '1', user_id: 'testuser' };

      mockUsersRepository.findOne
        .mockResolvedValueOnce(existingUser) // user_id 중복
        .mockResolvedValueOnce(null); // email 중복 확인 (실행 안됨)

      await expect(service.register(registerDto)).rejects.toThrow(
        new ConflictException('이미 있는 아이디입니다.'),
      );

      expect(mockUsersRepository.save).not.toHaveBeenCalled();
    });

    it('회원가입 실패 - 중복된 email', async () => {
      const existingUser = { id: '1', email: 'test@example.com' };

      mockUsersRepository.findOne
        .mockResolvedValueOnce(null) // user_id 중복 아님
        .mockResolvedValueOnce(existingUser); // email 중복

      await expect(service.register(registerDto)).rejects.toThrow(
        new ConflictException('이미 있는 이메일입니다.'),
      );

      expect(mockUsersRepository.save).not.toHaveBeenCalled();
    });

    it('기본 role은 USER로 설정되어야 함', async () => {
      mockUsersRepository.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');

      const createdUser = {
        id: '1',
        user_id: 'testuser',
        username: '홍길동',
        nickname: '흥부',
        email: 'test@example.com',
        password: 'hashed_password',
        role: 'USER',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockUsersRepository.create.mockReturnValue(createdUser);
      mockUsersRepository.save.mockResolvedValue(createdUser);
      mockConfigService.get.mockReturnValue('12');
      mockJwtService.signAsync.mockResolvedValue('mock.jwt.token');
      mockRefreshTokenRepository.create.mockReturnValue({});
      mockRefreshTokenRepository.save.mockResolvedValue({});

      await service.register(registerDto);

      expect(mockUsersRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'USER',
        }),
      );
    });
  });

  describe('validateUser', () => {
    const userId = 'testuser';
    const password = 'P@ssw0rd!';

    it('올바른 자격증명으로 유저 반환', async () => {
      const user = {
        id: '1',
        user_id: userId,
        password: 'hashed_password',
        username: '홍길동',
        email: 'test@example.com',
      };

      const mockQueryBuilder = {
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(user),
      };

      mockUsersRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser(userId, password);

      expect(result).toEqual(user);
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith('user.password');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'user.user_id = :user_id',
        { user_id: userId },
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(password, user.password);
    });

    it('존재하지 않는 user_id로 UnauthorizedException 발생', async () => {
      const mockQueryBuilder = {
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };

      mockUsersRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await expect(service.validateUser(userId, password)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.validateUser(userId, password)).rejects.toThrow(
        'invalid credentials',
      );
    });

    it('잘못된 비밀번호로 UnauthorizedException 발생', async () => {
      const user = {
        id: '1',
        user_id: userId,
        password: 'hashed_password',
        username: '홍길동',
      };

      const mockQueryBuilder = {
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(user),
      };

      mockUsersRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.validateUser(userId, password)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.validateUser(userId, password)).rejects.toThrow(
        'invalid credentials',
      );
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      user_id: 'testuser',
      password: 'P@ssw0rd!',
    };

    it('로그인 성공 - 유저 정보와 토큰 반환', async () => {
      const user = {
        id: '1',
        user_id: 'testuser',
        username: '홍길동',
        nickname: '흥부',
        email: 'test@example.com',
        password: 'hashed_password',
        role: 'USER',
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockQueryBuilder = {
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(user),
      };

      mockUsersRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockUsersRepository.update.mockResolvedValue({ affected: 1 });
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'JWT_SECRET') return 'test_secret';
        if (key === 'JWT_REFRESH_SECRET') return 'test_refresh_secret';
        if (key === 'JWT_EXPIRES_IN') return '1d';
        return null;
      });
      mockJwtService.signAsync
        .mockResolvedValueOnce('mock.access.token')
        .mockResolvedValueOnce('mock.refresh.token');
      mockRefreshTokenRepository.create.mockReturnValue({
        id: 1,
        userId: user.id,
        token: 'hashed_refresh_token',
        expiresAt: new Date(),
      });
      mockRefreshTokenRepository.save.mockResolvedValue({});

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('accessTokenExpiresIn');
      expect(result.accessToken).toBe('mock.access.token');
      expect(result.refreshToken).toBe('mock.refresh.token');
      expect(result.accessTokenExpiresIn).toBe(900); // 15분
      expect(result.user).not.toHaveProperty('password');

      // last_login_at 업데이트 확인
      expect(mockUsersRepository.update).toHaveBeenCalledWith(
        user.id,
        expect.objectContaining({
          last_login_at: expect.any(Date),
        }),
      );

      // Access Token 생성 확인
      expect(mockJwtService.signAsync).toHaveBeenNthCalledWith(
        1,
        {
          sub: user.id,
          username: user.username,
          role: user.role,
        },
        {
          expiresIn: 900, // 15분
        },
      );

      // Refresh Token 생성 확인
      expect(mockJwtService.signAsync).toHaveBeenNthCalledWith(
        2,
        {
          sub: user.id,
          username: user.username,
          role: user.role,
        },
        {
          expiresIn: 604800,
        },
      );
    });

    it('로그인 실패 - 잘못된 자격증명', async () => {
      const mockQueryBuilder = {
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };

      mockUsersRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'invalid credentials',
      );

      expect(mockUsersRepository.update).not.toHaveBeenCalled();
      expect(mockJwtService.signAsync).not.toHaveBeenCalled();
    });
  });

  describe('sanitize (private method)', () => {
    it('비밀번호를 제외한 유저 정보 반환', async () => {
      const registerDto: RegisterDto = {
        user_id: 'testuser',
        email: 'test@example.com',
        password: 'P@ssw0rd!',
        username: '홍길동',
        nickname: '흥부',
      };

      const savedUser = {
        id: '1',
        user_id: 'testuser',
        username: '홍길동',
        nickname: '흥부',
        email: 'test@example.com',
        password: 'hashed_password',
        role: 'USER',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockUsersRepository.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      mockUsersRepository.create.mockReturnValue(savedUser);
      mockUsersRepository.save.mockResolvedValue(savedUser);
      mockConfigService.get.mockReturnValue('12');
      mockJwtService.signAsync.mockResolvedValue('mock.jwt.token');
      mockRefreshTokenRepository.create.mockReturnValue({});
      mockRefreshTokenRepository.save.mockResolvedValue({});

      const result = await service.register(registerDto);

      expect(result.user).toHaveProperty('id');
      expect(result.user).toHaveProperty('user_id');
      expect(result.user).toHaveProperty('username');
      expect(result.user).toHaveProperty('email');
      expect(result.user).toHaveProperty('role');
      expect(result.user).not.toHaveProperty('password');
    });
  });
});
