import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<Partial<UsersService>>;
  let jwtService: jest.Mocked<Partial<JwtService>>;

  beforeEach(async () => {
    usersService = {
      create: jest.fn(),
      findByEmail: jest.fn(),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mocked-jwt-token'),
    };

    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should hash password and create user', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'alice@example.com',
        passwordHash: 'hashed-password',
      };
      usersService.create!.mockResolvedValue(mockUser);

      const result = await service.register('alice@example.com', 'Secure123');

      expect(bcrypt.hash).toHaveBeenCalledWith('Secure123', 12);
      expect(usersService.create).toHaveBeenCalledWith(
        'alice@example.com',
        'hashed-password',
      );
      expect(result).toEqual({
        id: 'user-id',
        email: 'alice@example.com',
      });
    });

    it('should throw on duplicate email', async () => {
      usersService.create!.mockRejectedValue(
        new ConflictException('Email already registered'),
      );

      await expect(
        service.register('alice@example.com', 'Secure123'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('validateUser', () => {
    it('should return user without passwordHash on valid credentials', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'alice@example.com',
        passwordHash: 'hashed-password',
      };
      usersService.findByEmail!.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser(
        'alice@example.com',
        'Secure123',
      );

      expect(result).toEqual({
        id: 'user-id',
        email: 'alice@example.com',
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'Secure123',
        'hashed-password',
      );
    });

    it('should return null when user not found', async () => {
      usersService.findByEmail!.mockResolvedValue(null);

      const result = await service.validateUser(
        'nobody@example.com',
        'Secure123',
      );

      expect(result).toBeNull();
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should return null when password does not match', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'alice@example.com',
        passwordHash: 'hashed-password',
      };
      usersService.findByEmail!.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser(
        'alice@example.com',
        'WrongPass',
      );

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access_token', async () => {
      const user = { id: 'user-id', email: 'alice@example.com' };

      const result = service.login(user);

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 'user-id',
        email: 'alice@example.com',
      });
      expect(result).toEqual({ access_token: 'mocked-jwt-token' });
    });
  });
});
