import { Test, TestingModule } from '@nestjs/testing';
import { MeController } from './me.controller';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';

describe('MeController', () => {
  let controller: MeController;
  let service: UsersService;

  const mockUsersService = {
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

  const currentUser = {
    userId: '1',
    username: '홍길동',
    role: 'USER',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MeController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<MeController>(MeController);
    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMe - 내 정보 조회', () => {
    it('현재 로그인한 유저의 정보를 반환해야 함', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);

      const result = await controller.getMe(currentUser);

      expect(result).toEqual(mockUser);
      expect(service.findOne).toHaveBeenCalledWith('1');
      expect(service.findOne).toHaveBeenCalledTimes(1);
    });

    it('서비스에서 발생한 예외를 그대로 전달해야 함', async () => {
      const error = new Error('User not found');
      mockUsersService.findOne.mockRejectedValue(error);

      await expect(controller.getMe(currentUser)).rejects.toThrow(error);
    });
  });

  describe('updateMe - 내 정보 수정', () => {
    const updateDto: UpdateUserDto = {
      username: '김철수',
      nickname: '철수맨',
      email: 'chulsoo@example.com',
    };

    it('본인 정보를 수정할 수 있어야 함', async () => {
      const updatedUser = { ...mockUser, ...updateDto };
      mockUsersService.update.mockResolvedValue(updatedUser);

      const result = await controller.updateMe(updateDto, currentUser);

      expect(result).toEqual(updatedUser);
      expect(service.update).toHaveBeenCalledWith('1', updateDto, '1', 'USER');
      expect(service.update).toHaveBeenCalledTimes(1);
    });

    it('비밀번호는 응답에 포함되지 않아야 함', async () => {
      const updatedUser = { ...mockUser, ...updateDto };
      mockUsersService.update.mockResolvedValue(updatedUser);

      const result = await controller.updateMe(updateDto, currentUser);

      expect(result).not.toHaveProperty('password');
    });

    it('빈 객체로도 수정 요청이 가능해야 함', async () => {
      const emptyDto: UpdateUserDto = {};
      mockUsersService.update.mockResolvedValue(mockUser);

      const result = await controller.updateMe(emptyDto, currentUser);

      expect(result).toEqual(mockUser);
      expect(service.update).toHaveBeenCalledWith('1', emptyDto, '1', 'USER');
    });

    it('일부 필드만 수정 가능해야 함', async () => {
      const partialDto: UpdateUserDto = { nickname: '새별명' };
      const updatedUser = { ...mockUser, nickname: '새별명' };
      mockUsersService.update.mockResolvedValue(updatedUser);

      const result = await controller.updateMe(partialDto, currentUser);

      expect(result.nickname).toBe('새별명');
      expect(result.email).toBe(mockUser.email); // 변경 안됨
      expect(service.update).toHaveBeenCalledWith('1', partialDto, '1', 'USER');
    });

    it('서비스에서 발생한 예외를 그대로 전달해야 함', async () => {
      const error = new Error('Update failed');
      mockUsersService.update.mockRejectedValue(error);

      await expect(
        controller.updateMe(updateDto, currentUser),
      ).rejects.toThrow(error);
    });
  });

  describe('deleteMe - 내 계정 삭제 (회원 탈퇴)', () => {
    it('본인 계정을 삭제할 수 있어야 함', async () => {
      mockUsersService.remove.mockResolvedValue(undefined);

      const result = await controller.deleteMe(currentUser);

      expect(result).toBeUndefined();
      expect(service.remove).toHaveBeenCalledWith('1', '1', 'USER');
      expect(service.remove).toHaveBeenCalledTimes(1);
    });

    it('반환값이 없어야 함 (void)', async () => {
      mockUsersService.remove.mockResolvedValue(undefined);

      const result = await controller.deleteMe(currentUser);

      expect(result).toBeUndefined();
    });

    it('서비스에서 발생한 예외를 그대로 전달해야 함', async () => {
      const error = new Error('Delete failed');
      mockUsersService.remove.mockRejectedValue(error);

      await expect(controller.deleteMe(currentUser)).rejects.toThrow(error);
    });
  });

  describe('통합 시나리오 - 마이페이지 플로우', () => {
    it('내 정보 조회 → 수정 → 삭제 전체 플로우가 동작해야 함', async () => {
      // 1. 내 정보 조회
      mockUsersService.findOne.mockResolvedValueOnce(mockUser);
      const me = await controller.getMe(currentUser);
      expect(me.id).toBe('1');

      // 2. 내 정보 수정
      const updateDto: UpdateUserDto = { nickname: '수정됨' };
      const updatedUser = { ...mockUser, nickname: '수정됨' };
      mockUsersService.update.mockResolvedValueOnce(updatedUser);
      const updated = await controller.updateMe(updateDto, currentUser);
      expect(updated.nickname).toBe('수정됨');

      // 3. 회원 탈퇴
      mockUsersService.remove.mockResolvedValueOnce(undefined);
      await expect(
        controller.deleteMe(currentUser),
      ).resolves.toBeUndefined();

      // 모든 메서드가 호출되었는지 확인
      expect(service.findOne).toHaveBeenCalledTimes(1);
      expect(service.update).toHaveBeenCalledTimes(1);
      expect(service.remove).toHaveBeenCalledTimes(1);
    });
  });

  describe('ADMIN 유저의 /me 엔드포인트 사용', () => {
    const adminUser = {
      userId: '99',
      username: '관리자',
      role: 'ADMIN',
    };

    const adminUserData = {
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

    it('ADMIN도 /me 엔드포인트로 자신의 정보를 조회할 수 있어야 함', async () => {
      mockUsersService.findOne.mockResolvedValue(adminUserData);

      const result = await controller.getMe(adminUser);

      expect(result).toEqual(adminUserData);
      expect(service.findOne).toHaveBeenCalledWith('99');
    });

    it('ADMIN도 /me 엔드포인트로 자신의 정보를 수정할 수 있어야 함', async () => {
      const updateDto: UpdateUserDto = { nickname: 'superadmin' };
      const updated = { ...adminUserData, nickname: 'superadmin' };
      mockUsersService.update.mockResolvedValue(updated);

      const result = await controller.updateMe(updateDto, adminUser);

      expect(result.nickname).toBe('superadmin');
      expect(service.update).toHaveBeenCalledWith('99', updateDto, '99', 'ADMIN');
    });
  });
});
