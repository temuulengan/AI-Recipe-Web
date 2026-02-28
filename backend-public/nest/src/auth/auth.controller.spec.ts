import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('회원가입 성공 - 유저 정보와 토큰을 반환해야 함', async () => {
      const registerDto: RegisterDto = {
        user_id: 'testuser',
        email: 'test@example.com',
        password: 'P@ssw0rd!',
        username: '홍길동',
        nickname: '흥부',
      };

      const mockResponse = {
        user: {
          id: '1',
          user_id: 'testuser',
          username: '홍길동',
          nickname: '흥부',
          email: 'test@example.com',
          role: 'USER',
          created_at: new Date(),
          updated_at: new Date(),
        },
        access_token: 'mock.jwt.token',
      };

      mockAuthService.register.mockResolvedValue(mockResponse);

      const result = await controller.register(registerDto);

      expect(result).toEqual(mockResponse);
      expect(service.register).toHaveBeenCalledWith(registerDto);
      expect(service.register).toHaveBeenCalledTimes(1);
    });

    it('회원가입 실패 - 중복된 user_id로 ConflictException 발생', async () => {
      const registerDto: RegisterDto = {
        user_id: 'duplicateuser',
        email: 'test@example.com',
        password: 'P@ssw0rd!',
        username: '홍길동',
        nickname: '흥부',
      };

      mockAuthService.register.mockRejectedValue(
        new ConflictException('이미 있는 아이디입니다.'),
      );

      await expect(controller.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(controller.register(registerDto)).rejects.toThrow(
        '이미 있는 아이디입니다.',
      );
      expect(service.register).toHaveBeenCalledWith(registerDto);
    });

    it('회원가입 실패 - 중복된 email로 ConflictException 발생', async () => {
      const registerDto: RegisterDto = {
        user_id: 'testuser',
        email: 'duplicate@example.com',
        password: 'P@ssw0rd!',
        username: '홍길동',
        nickname: '흥부',
      };

      mockAuthService.register.mockRejectedValue(
        new ConflictException('이미 있는 이메일입니다.'),
      );

      await expect(controller.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(controller.register(registerDto)).rejects.toThrow(
        '이미 있는 이메일입니다.',
      );
    });
  });

  describe('login', () => {
    it('로그인 성공 - 유저 정보와 토큰을 반환해야 함', async () => {
      const loginDto: LoginDto = {
        user_id: 'testuser',
        password: 'P@ssw0rd!',
      };

      const mockResponse = {
        user: {
          id: '1',
          user_id: 'testuser',
          username: '홍길동',
          nickname: '흥부',
          email: 'test@example.com',
          role: 'USER',
          last_login_at: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        },
        access_token: 'mock.jwt.token',
      };

      mockAuthService.login.mockResolvedValue(mockResponse);

      const result = await controller.login(loginDto);

      expect(result).toEqual(mockResponse);
      expect(service.login).toHaveBeenCalledWith(loginDto);
      expect(service.login).toHaveBeenCalledTimes(1);
    });

    it('로그인 실패 - 존재하지 않는 user_id로 UnauthorizedException 발생', async () => {
      const loginDto: LoginDto = {
        user_id: 'nonexistent',
        password: 'P@ssw0rd!',
      };

      mockAuthService.login.mockRejectedValue(
        new UnauthorizedException('invalid credentials'),
      );

      await expect(controller.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(controller.login(loginDto)).rejects.toThrow(
        'invalid credentials',
      );
      expect(service.login).toHaveBeenCalledWith(loginDto);
    });

    it('로그인 실패 - 잘못된 비밀번호로 UnauthorizedException 발생', async () => {
      const loginDto: LoginDto = {
        user_id: 'testuser',
        password: 'wrongpassword',
      };

      mockAuthService.login.mockRejectedValue(
        new UnauthorizedException('invalid credentials'),
      );

      await expect(controller.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(service.login).toHaveBeenCalledWith(loginDto);
    });
  });

  describe('응답 구조 검증', () => {
    it('register 응답은 user와 access_token을 포함해야 함', async () => {
      const registerDto: RegisterDto = {
        user_id: 'testuser',
        email: 'test@example.com',
        password: 'P@ssw0rd!',
        username: '홍길동',
        nickname: '흥부',
      };

      const mockResponse = {
        user: {
          id: '1',
          user_id: 'testuser',
          username: '홍길동',
          nickname: '흥부',
          email: 'test@example.com',
          role: 'USER',
          created_at: new Date(),
          updated_at: new Date(),
        },
        access_token: 'mock.jwt.token',
      };

      mockAuthService.register.mockResolvedValue(mockResponse);

      const result = await controller.register(registerDto);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('access_token');
      expect(result.user).toHaveProperty('id');
      expect(result.user).toHaveProperty('user_id');
      expect(result.user).toHaveProperty('email');
      expect(result.user).not.toHaveProperty('password'); // 비밀번호는 응답에 포함되지 않음
    });

    it('login 응답은 user와 access_token을 포함해야 함', async () => {
      const loginDto: LoginDto = {
        user_id: 'testuser',
        password: 'P@ssw0rd!',
      };

      const mockResponse = {
        user: {
          id: '1',
          user_id: 'testuser',
          username: '홍길동',
          nickname: '흥부',
          email: 'test@example.com',
          role: 'USER',
          last_login_at: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        },
        access_token: 'mock.jwt.token',
      };

      mockAuthService.login.mockResolvedValue(mockResponse);

      const result = await controller.login(loginDto);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('access_token');
      expect(result.user).toHaveProperty('last_login_at'); // login은 last_login_at 포함
      expect(result.user).not.toHaveProperty('password'); // 비밀번호는 응답에 포함되지 않음
    });
  });
});
