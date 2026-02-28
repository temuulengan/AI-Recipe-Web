import { Test, TestingModule } from '@nestjs/testing';
import { AdminUsersController } from './users.controller';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { NotFoundException } from '@nestjs/common';

describe('AdminUsersController - ADMIN 전용', () => {
  let controller: AdminUsersController;
  let service: UsersService;

  const mockUsersService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockUser = {
    id: '1',
    user_id: 'testuser',
    username: '홍길동',
    nickname: '흥부',
    email: 'test@example.com',
    role: 'USER',
    last_login_at: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockAdmin = {
    id: '99',
    user_id: 'admin',
    username: '관리자',
    nickname: 'admin',
    email: 'admin@example.com',
    role: 'ADMIN',
    last_login_at: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminUsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<AdminUsersController>(AdminUsersController);
    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll - 전체 유저 목록 조회 (ADMIN 전용)', () => {
    it('✅ ADMIN - 전체 유저 목록 조회 성공', async () => {
      const users = [mockUser, mockAdmin];
      mockUsersService.findAll.mockResolvedValue(users);

      const result = await controller.findAll();

      expect(result).toEqual(users);
      expect(service.findAll).toHaveBeenCalledTimes(1);
    });

    it('반환되는 유저 정보에 비밀번호가 포함되지 않아야 함', async () => {
      const users = [mockUser];
      mockUsersService.findAll.mockResolvedValue(users);

      const result = await controller.findAll();

      result.forEach((user) => {
        expect(user).not.toHaveProperty('password');
      });
    });

    it('빈 배열도 정상적으로 반환해야 함', async () => {
      mockUsersService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('findOne - 특정 유저 상세 조회 (ADMIN 전용)', () => {
    it('✅ ADMIN - 특정 유저 조회 성공', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);

      const result = await controller.findOne('1');

      expect(result).toEqual(mockUser);
      expect(service.findOne).toHaveBeenCalledWith('1');
      expect(service.findOne).toHaveBeenCalledTimes(1);
    });

    it('존재하지 않는 유저 조회 시 NotFoundException 발생', async () => {
      mockUsersService.findOne.mockRejectedValue(
        new NotFoundException('ID가 999인 유저를 찾을 수 없습니다.'),
      );

      await expect(controller.findOne('999')).rejects.toThrow(NotFoundException);
      await expect(controller.findOne('999')).rejects.toThrow(
        'ID가 999인 유저를 찾을 수 없습니다.',
      );
    });

    it('다양한 ID로 조회 가능해야 함', async () => {
      mockUsersService.findOne.mockResolvedValueOnce(mockUser);
      mockUsersService.findOne.mockResolvedValueOnce(mockAdmin);

      await controller.findOne('1');
      expect(service.findOne).toHaveBeenCalledWith('1');

      await controller.findOne('99');
      expect(service.findOne).toHaveBeenCalledWith('99');
      
      expect(service.findOne).toHaveBeenCalledTimes(2);
    });
  });

  describe('update - 유저 정보 수정 (ADMIN 전용)', () => {
    const updateDto: UpdateUserDto = {
      username: '김철수',
      nickname: '철수맨',
    };

    it('✅ ADMIN - 모든 유저 정보 수정 가능', async () => {
      const updatedUser = { ...mockUser, ...updateDto };
      mockUsersService.update.mockResolvedValue(updatedUser);

      const result = await controller.update('1', updateDto);

      expect(result).toEqual(updatedUser);
      expect(service.update).toHaveBeenCalledWith('1', updateDto, '1', 'ADMIN');
      expect(service.update).toHaveBeenCalledTimes(1);
    });

    it('✅ ADMIN - 다른 유저(ID: 2) 정보도 수정 가능', async () => {
      const otherUser = { ...mockUser, id: '2' };
      const updatedOtherUser = { ...otherUser, ...updateDto };
      mockUsersService.update.mockResolvedValue(updatedOtherUser);

      const result = await controller.update('2', updateDto);

      expect(result).toEqual(updatedOtherUser);
      expect(service.update).toHaveBeenCalledWith('2', updateDto, '2', 'ADMIN');
    });

    it('일부 필드만 수정 가능해야 함', async () => {
      const partialDto: UpdateUserDto = { username: '새이름만' };
      const updated = { ...mockUser, username: '새이름만' };
      mockUsersService.update.mockResolvedValue(updated);

      const result = await controller.update('1', partialDto);

      expect(result.username).toBe('새이름만');
      expect(service.update).toHaveBeenCalledWith('1', partialDto, '1', 'ADMIN');
    });

    it('존재하지 않는 유저 수정 시 NotFoundException 발생', async () => {
      mockUsersService.update.mockRejectedValue(
        new NotFoundException('ID가 999인 유저를 찾을 수 없습니다.'),
      );

      await expect(controller.update('999', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('수정 후 비밀번호가 응답에 포함되지 않아야 함', async () => {
      const updatedUser = { ...mockUser, ...updateDto };
      mockUsersService.update.mockResolvedValue(updatedUser);

      const result = await controller.update('1', updateDto);

      expect(result).not.toHaveProperty('password');
    });
  });

  describe('remove - 유저 삭제 (ADMIN 전용)', () => {
    it('✅ ADMIN - 모든 유저 삭제 가능', async () => {
      mockUsersService.remove.mockResolvedValue(undefined);

      const result = await controller.remove('1');

      expect(result).toBeUndefined();
      expect(service.remove).toHaveBeenCalledWith('1', '1', 'ADMIN');
      expect(service.remove).toHaveBeenCalledTimes(1);
    });

    it('✅ ADMIN - 다른 유저(ID: 2)도 삭제 가능', async () => {
      mockUsersService.remove.mockResolvedValue(undefined);

      await controller.remove('2');

      expect(service.remove).toHaveBeenCalledWith('2', '2', 'ADMIN');
    });

    it('존재하지 않는 유저 삭제 시 NotFoundException 발생', async () => {
      mockUsersService.remove.mockRejectedValue(
        new NotFoundException('ID가 999인 유저를 찾을 수 없습니다.'),
      );

      await expect(controller.remove('999')).rejects.toThrow(NotFoundException);
    });

    it('삭제는 반환값이 없어야 함 (void)', async () => {
      mockUsersService.remove.mockResolvedValue(undefined);

      const result = await controller.remove('1');

      expect(result).toBeUndefined();
    });
  });

  describe('ADMIN 관리 페이지 통합 시나리오', () => {
    it('전체 조회 → 특정 유저 상세 → 수정 → 삭제 플로우', async () => {
      const updateDto: UpdateUserDto = { nickname: '수정됨' };

      // 1. 전체 유저 목록 조회
      mockUsersService.findAll.mockResolvedValueOnce([mockUser, mockAdmin]);
      const allUsers = await controller.findAll();
      expect(allUsers).toHaveLength(2);

      // 2. 특정 유저 상세 조회
      mockUsersService.findOne.mockResolvedValueOnce(mockUser);
      const user = await controller.findOne('1');
      expect(user.id).toBe('1');

      // 3. 유저 정보 수정
      const updatedUser = { ...mockUser, nickname: '수정됨' };
      mockUsersService.update.mockResolvedValueOnce(updatedUser);
      const updated = await controller.update('1', updateDto);
      expect(updated.nickname).toBe('수정됨');

      // 4. 유저 삭제
      mockUsersService.remove.mockResolvedValueOnce(undefined);
      await expect(controller.remove('1')).resolves.toBeUndefined();

      // 모든 서비스 메서드가 호출되었는지 확인
      expect(service.findAll).toHaveBeenCalledTimes(1);
      expect(service.findOne).toHaveBeenCalledTimes(1);
      expect(service.update).toHaveBeenCalledTimes(1);
      expect(service.remove).toHaveBeenCalledTimes(1);
    });

    it('여러 유저를 순차적으로 관리할 수 있어야 함', async () => {
      // 유저 1 수정
      mockUsersService.update.mockResolvedValueOnce({
        ...mockUser,
        nickname: '유저1수정',
      });
      await controller.update('1', { nickname: '유저1수정' });

      // 유저 2 수정
      mockUsersService.update.mockResolvedValueOnce({
        ...mockUser,
        id: '2',
        nickname: '유저2수정',
      });
      await controller.update('2', { nickname: '유저2수정' });

      expect(service.update).toHaveBeenCalledTimes(2);
      expect(service.update).toHaveBeenNthCalledWith(
        1,
        '1',
        { nickname: '유저1수정' },
        '1',
        'ADMIN',
      );
      expect(service.update).toHaveBeenNthCalledWith(
        2,
        '2',
        { nickname: '유저2수정' },
        '2',
        'ADMIN',
      );
    });
  });
});
