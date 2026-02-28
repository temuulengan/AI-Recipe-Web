import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';

describe('UsersService', () => {
  let service: UsersService;
  let repository: Repository<User>;

  const mockUsersRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockUser: User = {
    id: '1',
    user_id: 'testuser',
    username: '홍길동',
    nickname: '흥부',
    email: 'test@example.com',
    password: 'hashed_password',
    role: 'USER',
    llm_count: 10,
    last_login_at: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockAdmin: User = {
    id: '99',
    user_id: 'admin',
    username: '관리자',
    nickname: 'admin',
    email: 'admin@example.com',
    password: 'hashed_password',
    role: 'ADMIN',
    llm_count: 100,
    last_login_at: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUsersRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll - 전체 유저 목록 조회', () => {
    it('모든 유저 목록을 최신순으로 반환해야 함', async () => {
      const users = [mockAdmin, mockUser]; // 최신순
      mockUsersRepository.find.mockResolvedValue(users);

      const result = await service.findAll();

      expect(result).toEqual(users);
      expect(repository.find).toHaveBeenCalledWith({
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
          created_at: 'DESC',
        },
      });
    });

    it('비밀번호를 select에서 제외해야 함', async () => {
      mockUsersRepository.find.mockResolvedValue([mockUser]);

      await service.findAll();

      const callArgs = mockUsersRepository.find.mock.calls[0][0];
      expect(callArgs.select).not.toContain('password');
    });

    it('빈 배열도 정상적으로 반환해야 함', async () => {
      mockUsersRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('findOne - 특정 유저 상세 조회', () => {
    it('유저 ID로 특정 유저를 조회해야 함', async () => {
      mockUsersRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne('1');

      expect(result).toEqual(mockUser);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        select: expect.arrayContaining([
          'id',
          'user_id',
          'username',
          'email',
          'role',
        ]),
      });
    });

    it('존재하지 않는 유저 조회 시 NotFoundException 발생', async () => {
      mockUsersRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('999')).rejects.toThrow(
        'ID가 999인 유저를 찾을 수 없습니다.',
      );
    });

    it('비밀번호를 select에서 제외해야 함', async () => {
      mockUsersRepository.findOne.mockResolvedValue(mockUser);

      await service.findOne('1');

      const callArgs = mockUsersRepository.findOne.mock.calls[0][0];
      expect(callArgs.select).not.toContain('password');
    });
  });

  describe('findByUserId - user_id로 유저 조회', () => {
    it('user_id로 유저를 조회해야 함', async () => {
      mockUsersRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByUserId('testuser');

      expect(result).toEqual(mockUser);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { user_id: 'testuser' },
        select: expect.any(Array),
      });
    });

    it('존재하지 않는 user_id 조회 시 NotFoundException 발생', async () => {
      mockUsersRepository.findOne.mockResolvedValue(null);

      await expect(service.findByUserId('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findByUserId('nonexistent')).rejects.toThrow(
        'user_id가 nonexistent인 유저를 찾을 수 없습니다.',
      );
    });
  });

  describe('update - 유저 정보 수정', () => {
    const updateDto: UpdateUserDto = {
      username: '김철수',
      nickname: '철수맨',
      email: 'chulsoo@example.com',
    };

    describe('시나리오 1: 일반 유저 (USER)', () => {
      const currentUserId = '1';
      const currentUserRole = 'USER';

      it('✅ 본인 정보 수정 성공', async () => {
        const updatedUser = { ...mockUser, ...updateDto };
        mockUsersRepository.findOne
          .mockResolvedValueOnce(mockUser) // 유저 조회
          .mockResolvedValueOnce(null); // 이메일 중복 검사 (중복 없음)
        mockUsersRepository.save.mockResolvedValue(updatedUser);

        const result = await service.update(
          '1',
          updateDto,
          currentUserId,
          currentUserRole,
        );

        expect(result.username).toBe('김철수');
        expect(result.nickname).toBe('철수맨');
        expect(result).not.toHaveProperty('password'); // 비밀번호 제외
        expect(repository.save).toHaveBeenCalled();
      });

      it('❌ 다른 유저 정보 수정 불가 - ForbiddenException', async () => {
        mockUsersRepository.findOne.mockResolvedValue({ ...mockUser, id: '2' });

        await expect(
          service.update('2', updateDto, currentUserId, currentUserRole),
        ).rejects.toThrow(ForbiddenException);

        await expect(
          service.update('2', updateDto, currentUserId, currentUserRole),
        ).rejects.toThrow('본인 또는 관리자만 수정할 수 있습니다.');

        expect(repository.save).not.toHaveBeenCalled();
      });

      it('수정 후 비밀번호가 응답에 포함되지 않아야 함', async () => {
        const userWithPassword = { ...mockUser, password: 'hashed' };
        mockUsersRepository.findOne
          .mockResolvedValueOnce(mockUser) // 유저 조회
          .mockResolvedValueOnce(null); // 이메일 중복 검사 (중복 없음)
        mockUsersRepository.save.mockResolvedValue(userWithPassword);

        const result = await service.update(
          '1',
          {},
          currentUserId,
          currentUserRole,
        );

        expect(result).not.toHaveProperty('password');
      });

      it('❌ 이메일 중복 시 ConflictException', async () => {
        mockUsersRepository.findOne.mockReset(); // mock 완전 초기화
        
        const duplicateUser = { ...mockUser, id: '2', email: 'chulsoo@example.com' };
        mockUsersRepository.findOne
          .mockResolvedValueOnce(mockUser) // 유저 조회
          .mockResolvedValueOnce(duplicateUser); // 이메일 중복 발견

        await expect(
          service.update('1', updateDto, currentUserId, currentUserRole),
        ).rejects.toThrow(ConflictException);

        mockUsersRepository.findOne.mockReset(); // mock 완전 초기화
        
        // 두 번째 호출을 위해 다시 mock 설정
        mockUsersRepository.findOne
          .mockResolvedValueOnce(mockUser) // 유저 조회
          .mockResolvedValueOnce(duplicateUser); // 이메일 중복 발견

        await expect(
          service.update('1', updateDto, currentUserId, currentUserRole),
        ).rejects.toThrow('이미 사용 중인 이메일입니다.');

        expect(repository.save).not.toHaveBeenCalled();
      });
    });

    describe('시나리오 2: 관리자 (ADMIN)', () => {
      const adminUserId = '99';
      const adminRole = 'ADMIN';

      it('✅ 모든 유저 정보 수정 가능', async () => {
        mockUsersRepository.findOne.mockReset(); // mock 완전 초기화
        mockUsersRepository.save.mockReset(); // mock 완전 초기화
        
        const updatedUser = { ...mockUser, ...updateDto };
        mockUsersRepository.findOne
          .mockResolvedValueOnce(mockUser) // 유저 조회
          .mockResolvedValueOnce(null); // 이메일 중복 검사 (중복 없음)
        mockUsersRepository.save.mockResolvedValue(updatedUser);

        const result = await service.update(
          '1',
          updateDto,
          adminUserId,
          adminRole,
        );

        expect(result.username).toBe('김철수');
        expect(repository.save).toHaveBeenCalled();
      });

      it('✅ 다른 유저(ID: 2) 정보도 수정 가능', async () => {
        const otherUser = { ...mockUser, id: '2', user_id: 'otheruser' };
        const updatedOtherUser = { ...otherUser, ...updateDto };
        mockUsersRepository.findOne
          .mockResolvedValueOnce(otherUser) // 유저 조회
          .mockResolvedValueOnce(null); // 이메일 중복 검사 (중복 없음)
        mockUsersRepository.save.mockResolvedValue(updatedOtherUser);

        const result = await service.update(
          '2',
          updateDto,
          adminUserId,
          adminRole,
        );

        expect(result.id).toBe('2');
        expect(result.username).toBe('김철수');
        expect(repository.save).toHaveBeenCalled();
      });

      it('ADMIN도 존재하지 않는 유저 수정 시 NotFoundException', async () => {
        mockUsersRepository.findOne.mockReset(); // mock 완전 초기화
        
        mockUsersRepository.findOne.mockResolvedValueOnce(null); // 유저 없음

        await expect(
          service.update('999', updateDto, adminUserId, adminRole),
        ).rejects.toThrow(NotFoundException);

        mockUsersRepository.findOne.mockReset(); // mock 완전 초기화
        mockUsersRepository.findOne.mockResolvedValueOnce(null); // 유저 없음

        await expect(
          service.update('999', updateDto, adminUserId, adminRole),
        ).rejects.toThrow('ID가 999인 유저를 찾을 수 없습니다.');
      });
    });

    it('일부 필드만 수정 가능', async () => {
      mockUsersRepository.findOne.mockReset(); // mock 완전 초기화
      mockUsersRepository.save.mockReset(); // mock 완전 초기화
      
      const partialDto: UpdateUserDto = { username: '새이름만' };
      const updatedUser = { ...mockUser, username: '새이름만' };
      mockUsersRepository.findOne.mockResolvedValueOnce(mockUser); // 유저 조회만 (이메일 없으므로 중복 검사 안 함)
      mockUsersRepository.save.mockResolvedValue(updatedUser);

      const result = await service.update('1', partialDto, '1', 'USER');

      expect(result.username).toBe('새이름만');
      expect(result.email).toBe(mockUser.email); // 변경 안됨
    });

    it('빈 객체로 수정 시도해도 처리됨', async () => {
      const emptyDto: UpdateUserDto = {};
      mockUsersRepository.findOne.mockResolvedValueOnce(mockUser); // 유저 조회만 (이메일 없으므로 중복 검사 안 함)
      mockUsersRepository.save.mockResolvedValue(mockUser);

      const result = await service.update('1', emptyDto, '1', 'USER');

      expect(result).toBeDefined();
      expect(repository.save).toHaveBeenCalled();
    });
  });

  describe('remove - 유저 삭제', () => {
    describe('시나리오 1: 일반 유저 (USER)', () => {
      const currentUserId = '1';
      const currentUserRole = 'USER';

      it('✅ 본인 계정 삭제 성공', async () => {
        mockUsersRepository.findOne.mockResolvedValue(mockUser);
        mockUsersRepository.remove.mockResolvedValue(mockUser);

        await service.remove('1', currentUserId, currentUserRole);

        expect(repository.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
        expect(repository.remove).toHaveBeenCalledWith(mockUser);
      });

      it('❌ 다른 유저 삭제 불가 - ForbiddenException', async () => {
        const otherUser = { ...mockUser, id: '2' };
        mockUsersRepository.findOne.mockResolvedValue(otherUser);

        await expect(
          service.remove('2', currentUserId, currentUserRole),
        ).rejects.toThrow(ForbiddenException);

        await expect(
          service.remove('2', currentUserId, currentUserRole),
        ).rejects.toThrow('본인 또는 관리자만 삭제할 수 있습니다.');

        expect(repository.remove).not.toHaveBeenCalled();
      });
    });

    describe('시나리오 2: 관리자 (ADMIN)', () => {
      const adminUserId = '99';
      const adminRole = 'ADMIN';

      it('✅ 모든 유저 삭제 가능', async () => {
        mockUsersRepository.findOne.mockResolvedValue(mockUser);
        mockUsersRepository.remove.mockResolvedValue(mockUser);

        await service.remove('1', adminUserId, adminRole);

        expect(repository.remove).toHaveBeenCalledWith(mockUser);
      });

      it('✅ 다른 유저(ID: 2)도 삭제 가능', async () => {
        const otherUser = { ...mockUser, id: '2' };
        mockUsersRepository.findOne.mockResolvedValue(otherUser);
        mockUsersRepository.remove.mockResolvedValue(otherUser);

        await service.remove('2', adminUserId, adminRole);

        expect(repository.findOne).toHaveBeenCalledWith({ where: { id: '2' } });
        expect(repository.remove).toHaveBeenCalledWith(otherUser);
      });

      it('ADMIN도 존재하지 않는 유저 삭제 시 NotFoundException', async () => {
        mockUsersRepository.findOne.mockResolvedValue(null);

        await expect(
          service.remove('999', adminUserId, adminRole),
        ).rejects.toThrow(NotFoundException);

        await expect(
          service.remove('999', adminUserId, adminRole),
        ).rejects.toThrow('ID가 999인 유저를 찾을 수 없습니다.');
      });
    });

    it('존재하지 않는 유저 삭제 시 NotFoundException', async () => {
      mockUsersRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('999', '1', 'USER')).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.remove).not.toHaveBeenCalled();
    });

    it('삭제는 반환값이 없어야 함 (void)', async () => {
      mockUsersRepository.findOne.mockResolvedValue(mockUser);
      mockUsersRepository.remove.mockResolvedValue(mockUser);

      const result = await service.remove('1', '1', 'USER');

      expect(result).toBeUndefined();
    });
  });

  describe('권한 통합 테스트', () => {
    const updateDto: UpdateUserDto = { username: '테스트' };

    describe('USER 역할의 모든 제약사항', () => {
      it('본인만 수정/삭제 가능, 다른 유저는 불가', async () => {
        // 본인 수정 성공
        mockUsersRepository.findOne.mockResolvedValueOnce(mockUser);
        mockUsersRepository.save.mockResolvedValueOnce({
          ...mockUser,
          ...updateDto,
        });
        const updated = await service.update('1', updateDto, '1', 'USER');
        expect(updated.username).toBe('테스트');

        // 다른 유저 수정 실패
        mockUsersRepository.findOne.mockResolvedValueOnce({
          ...mockUser,
          id: '2',
        });
        await expect(service.update('2', updateDto, '1', 'USER')).rejects.toThrow(
          ForbiddenException,
        );

        // 본인 삭제 성공
        mockUsersRepository.findOne.mockResolvedValueOnce(mockUser);
        mockUsersRepository.remove.mockResolvedValueOnce(mockUser);
        await expect(service.remove('1', '1', 'USER')).resolves.toBeUndefined();

        // 다른 유저 삭제 실패
        mockUsersRepository.findOne.mockResolvedValueOnce({
          ...mockUser,
          id: '2',
        });
        await expect(service.remove('2', '1', 'USER')).rejects.toThrow(
          ForbiddenException,
        );
      });
    });

    describe('ADMIN 역할의 모든 권한', () => {
      it('모든 유저 조회, 수정, 삭제 가능', async () => {
        // 전체 유저 조회
        mockUsersRepository.find.mockResolvedValue([mockUser, mockAdmin]);
        const allUsers = await service.findAll();
        expect(allUsers).toHaveLength(2);

        // 특정 유저 조회
        mockUsersRepository.findOne.mockResolvedValueOnce(mockUser);
        const user = await service.findOne('1');
        expect(user.id).toBe('1');

        // 다른 유저 수정
        mockUsersRepository.findOne.mockResolvedValueOnce(mockUser);
        mockUsersRepository.save.mockResolvedValueOnce({
          ...mockUser,
          ...updateDto,
        });
        const updated = await service.update('1', updateDto, '99', 'ADMIN');
        expect(updated.username).toBe('테스트');

        // 다른 유저 삭제
        mockUsersRepository.findOne.mockResolvedValueOnce(mockUser);
        mockUsersRepository.remove.mockResolvedValueOnce(mockUser);
        await expect(service.remove('1', '99', 'ADMIN')).resolves.toBeUndefined();
      });
    });
  });

  describe('보안 검증', () => {
    it('모든 조회 메서드는 비밀번호를 select에서 제외해야 함', async () => {
      // findAll
      mockUsersRepository.find.mockResolvedValue([mockUser]);
      await service.findAll();
      expect(mockUsersRepository.find.mock.calls[0][0].select).not.toContain(
        'password',
      );

      // findOne
      mockUsersRepository.findOne.mockResolvedValue(mockUser);
      await service.findOne('1');
      expect(
        mockUsersRepository.findOne.mock.calls[0][0].select,
      ).not.toContain('password');

      // findByUserId
      mockUsersRepository.findOne.mockResolvedValue(mockUser);
      await service.findByUserId('testuser');
      expect(
        mockUsersRepository.findOne.mock.calls[1][0].select,
      ).not.toContain('password');
    });

    it('update 메서드는 응답에서 비밀번호를 제거해야 함', async () => {
      const userWithPassword = { ...mockUser, password: 'secret' };
      mockUsersRepository.findOne.mockResolvedValue(mockUser);
      mockUsersRepository.save.mockResolvedValue(userWithPassword);

      const result = await service.update('1', {}, '1', 'USER');

      expect(result).not.toHaveProperty('password');
    });
  });
});
