import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<Partial<AuthService>>;

  beforeEach(async () => {
    authService = {
      register: jest.fn(),
      validateUser: jest.fn(),
      login: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('register', () => {
    it('should delegate to authService.register', async () => {
      const dto = { email: 'alice@example.com', password: 'Secure123' };
      const expected = { id: 'user-id', email: 'alice@example.com' };
      authService.register!.mockResolvedValue(expected);

      const result = await controller.register(dto);

      expect(authService.register).toHaveBeenCalledWith(
        'alice@example.com',
        'Secure123',
      );
      expect(result).toEqual(expected);
    });
  });

  describe('login', () => {
    it('should return access_token on valid credentials', async () => {
      const dto = { email: 'alice@example.com', password: 'Secure123' };
      const user = { id: 'user-id', email: 'alice@example.com' };
      const token = { access_token: 'jwt-token' };

      authService.validateUser!.mockResolvedValue(user);
      authService.login!.mockResolvedValue(token);

      const result = await controller.login(dto);

      expect(authService.validateUser).toHaveBeenCalledWith(
        'alice@example.com',
        'Secure123',
      );
      expect(authService.login).toHaveBeenCalledWith(user);
      expect(result).toEqual(token);
    });

    it('should throw UnauthorizedException on invalid credentials', async () => {
      const dto = { email: 'alice@example.com', password: 'WrongPass' };
      authService.validateUser!.mockResolvedValue(null);

      await expect(controller.login(dto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
