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
        firstName: 'Alice',
        lastName: 'Smith',
        gender: 'female',
        dateOfBirth: new Date('1990-01-01'),
        email: 'alice@example.com',
        phoneNumber: '+50377777777',
        passwordHash: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      usersService.create!.mockResolvedValue(mockUser);

      const result = await service.register({
        firstName: 'Alice',
        lastName: 'Smith',
        gender: 'female',
        dateOfBirth: '1990-01-01',
        email: 'alice@example.com',
        phoneNumber: '+50377777777',
        password: 'Secure123',
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('Secure123', 12);
      expect(usersService.create).toHaveBeenCalledWith({
        firstName: 'Alice',
        lastName: 'Smith',
        gender: 'female',
        dateOfBirth: new Date('1990-01-01'),
        email: 'alice@example.com',
        phoneNumber: '+50377777777',
        passwordHash: 'hashed-password',
      });
      expect(result).toEqual({
        id: 'user-id',
        firstName: 'Alice',
        lastName: 'Smith',
        gender: 'female',
        dateOfBirth: mockUser.dateOfBirth,
        email: 'alice@example.com',
        phoneNumber: '+50377777777',
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
    });

    it('should throw on duplicate email', async () => {
      usersService.create!.mockRejectedValue(
        new ConflictException('Email already registered'),
      );

      await expect(
        service.register({
          firstName: 'Alice',
          lastName: 'Smith',
          gender: 'female',
          dateOfBirth: '1990-01-01',
          email: 'alice@example.com',
          phoneNumber: '+50377777777',
          password: 'Secure123',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('validateUser', () => {
    it('should return user without passwordHash on valid credentials', async () => {
      const mockUser = {
        id: 'user-id',
        firstName: 'Alice',
        lastName: 'Smith',
        gender: 'female',
        dateOfBirth: new Date('1990-01-01'),
        email: 'alice@example.com',
        phoneNumber: '+50377777777',
        passwordHash: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      usersService.findByEmail!.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser(
        'alice@example.com',
        'Secure123',
      );

      expect(result).toEqual({
        id: 'user-id',
        firstName: 'Alice',
        lastName: 'Smith',
        gender: 'female',
        dateOfBirth: mockUser.dateOfBirth,
        email: 'alice@example.com',
        phoneNumber: '+50377777777',
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
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
        firstName: 'Alice',
        lastName: 'Smith',
        gender: 'female',
        dateOfBirth: new Date('1990-01-01'),
        email: 'alice@example.com',
        phoneNumber: '+50377777777',
        passwordHash: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
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
      const user = {
        id: 'user-id',
        firstName: 'Alice',
        lastName: 'Smith',
        gender: 'female',
        dateOfBirth: new Date('1990-01-01'),
        email: 'alice@example.com',
        phoneNumber: '+50377777777',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = service.login(user);

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 'user-id',
        email: 'alice@example.com',
        firstName: 'Alice',
        lastName: 'Smith',
      });
      expect(result).toEqual({ access_token: 'mocked-jwt-token' });
    });
  });
});
