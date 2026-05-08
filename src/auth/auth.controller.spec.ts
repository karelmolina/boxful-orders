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

  const registerDto = {
    firstName: 'Alice',
    lastName: 'Smith',
    gender: 'female',
    dateOfBirth: '1990-01-01',
    email: 'alice@example.com',
    phoneNumber: '+50377777777',
    password: 'Secure123',
    confirmPassword: 'Secure123',
  };

  describe('register', () => {
    it('should delegate to authService.register', async () => {
      const expected = {
        id: 'user-id',
        firstName: 'Alice',
        lastName: 'Smith',
        gender: 'female',
        dateOfBirth: new Date('1990-01-01'),
        email: 'alice@example.com',
        phoneNumber: '+50377777777',
      };
      authService.register!.mockResolvedValue(expected);

      const result = await controller.register(registerDto);

      expect(authService.register).toHaveBeenCalledWith({
        firstName: 'Alice',
        lastName: 'Smith',
        gender: 'female',
        dateOfBirth: '1990-01-01',
        email: 'alice@example.com',
        phoneNumber: '+50377777777',
        password: 'Secure123',
      });
      expect(result).toEqual(expected);
    });
  });

  describe('login', () => {
    it('should return access_token on valid credentials', async () => {
      const dto = { email: 'alice@example.com', password: 'Secure123' };
      const user = { id: 'user-id', email: 'alice@example.com' };
      const token = { access_token: 'jwt-token' };

      authService.validateUser!.mockResolvedValue(user as any);
      authService.login!.mockResolvedValue(token as any);

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
