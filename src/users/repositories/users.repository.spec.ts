import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';

import { UsersRepository } from './users.repository';
import { DatabaseService } from '../../database/database.service';

describe('UsersRepository', () => {
  let repository: UsersRepository;
  let prismaService: jest.Mocked<Partial<DatabaseService>>;

  beforeEach(async () => {
    prismaService = {
      user: {
        create: jest.fn(),
        findUnique: jest.fn(),
      } as unknown as DatabaseService['user'],
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersRepository,
        { provide: DatabaseService, useValue: prismaService },
      ],
    }).compile();

    repository = module.get<UsersRepository>(UsersRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const userPayload = {
    firstName: 'Alice',
    lastName: 'Smith',
    gender: 'female',
    dateOfBirth: new Date('1990-01-01'),
    email: 'alice@example.com',
    phoneNumber: '+50377777777',
    passwordHash: 'hashed',
  };

  describe('create', () => {
    it('should create a user and return it', async () => {
      const prismaUser = {
        ...userPayload,
        id: 'user-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (prismaService.user!.create as jest.Mock).mockResolvedValue(prismaUser);

      const result = await repository.create(userPayload);

      expect(prismaService.user!.create).toHaveBeenCalledWith({
        data: userPayload,
      });
      expect(result).toEqual(prismaUser);
    });

    it('should throw ConflictException on P2002 unique violation', async () => {
      const error = { code: 'P2002', message: 'Unique constraint failed' };
      (prismaService.user!.create as jest.Mock).mockRejectedValue(error);

      await expect(repository.create(userPayload)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should rethrow unknown errors', async () => {
      const error = new Error('Unknown error');
      (prismaService.user!.create as jest.Mock).mockRejectedValue(error);

      await expect(repository.create(userPayload)).rejects.toThrow(
        'Unknown error',
      );
    });
  });

  describe('findByEmail', () => {
    it('should return user when found', async () => {
      const prismaUser = {
        ...userPayload,
        id: 'user-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (prismaService.user!.findUnique as jest.Mock).mockResolvedValue(
        prismaUser,
      );

      const result = await repository.findByEmail('alice@example.com');

      expect(prismaService.user!.findUnique).toHaveBeenCalledWith({
        where: { email: 'alice@example.com' },
      });
      expect(result).toEqual(prismaUser);
    });

    it('should return null when not found', async () => {
      (prismaService.user!.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await repository.findByEmail('nobody@example.com');
      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      const prismaUser = {
        ...userPayload,
        id: 'user-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      (prismaService.user!.findUnique as jest.Mock).mockResolvedValue(
        prismaUser,
      );

      const result = await repository.findById('user-id');

      expect(prismaService.user!.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-id' },
      });
      expect(result).toEqual(prismaUser);
    });

    it('should return null when not found', async () => {
      (prismaService.user!.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await repository.findById('non-existent');
      expect(result).toBeNull();
    });
  });
});
