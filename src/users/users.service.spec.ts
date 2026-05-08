import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { UsersService } from './users.service';
import {
  USERS_REPOSITORY,
  IUsersRepository,
} from './repositories/users.repository.interface';
import { User } from './entities/user.entity';

class MockUsersRepository implements IUsersRepository {
  private users: User[] = [];

  async create(
    user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<User> {
    const existing = await this.findByEmail(user.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    const newUser = {
      id: crypto.randomUUID(),
      ...user,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.push(newUser);
    return newUser;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = this.users.find((u) => u.email === email);
    return user ?? null;
  }

  async findById(id: string): Promise<User | null> {
    const user = this.users.find((u) => u.id === id);
    return user ?? null;
  }

  clear() {
    this.users = [];
  }
}

describe('UsersService', () => {
  let service: UsersService;
  let repository: MockUsersRepository;

  beforeEach(async () => {
    repository = new MockUsersRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: USERS_REPOSITORY,
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    repository.clear();
  });

  const userPayload = {
    firstName: 'Alice',
    lastName: 'Smith',
    gender: 'female',
    dateOfBirth: new Date('1990-01-01'),
    email: 'alice@example.com',
    phoneNumber: '+50377777777',
    passwordHash: 'hashed-pass',
  };

  describe('create', () => {
    it('should create a user and return it', async () => {
      const user = await service.create(userPayload);
      expect(user.email).toBe('alice@example.com');
      expect(user.firstName).toBe('Alice');
      expect(user.passwordHash).toBe('hashed-pass');
      expect(user.id).toBeDefined();
    });

    it('should throw ConflictException for duplicate email', async () => {
      await service.create(userPayload);
      await expect(
        service.create({ ...userPayload, passwordHash: 'other-hash' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findByEmail', () => {
    it('should return user when found', async () => {
      await service.create(userPayload);
      const user = await service.findByEmail('alice@example.com');
      expect(user).toBeDefined();
      expect(user?.email).toBe('alice@example.com');
    });

    it('should return null when not found', async () => {
      const user = await service.findByEmail('nobody@example.com');
      expect(user).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      const created = await service.create(userPayload);
      const user = await service.findById(created.id);
      expect(user).toBeDefined();
      expect(user?.id).toBe(created.id);
    });

    it('should return null when not found', async () => {
      const user = await service.findById('non-existent-id');
      expect(user).toBeNull();
    });
  });
});
