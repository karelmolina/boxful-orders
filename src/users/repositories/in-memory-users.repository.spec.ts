import { ConflictException } from '@nestjs/common';
import { InMemoryUsersRepository } from './in-memory-users.repository';

describe('InMemoryUsersRepository', () => {
  let repository: InMemoryUsersRepository;

  beforeEach(() => {
    repository = new InMemoryUsersRepository();
  });

  describe('create', () => {
    it('should create a user with generated id', async () => {
      const user = await repository.create({
        email: 'alice@example.com',
        passwordHash: 'hashed',
      });
      expect(user.email).toBe('alice@example.com');
      expect(user.passwordHash).toBe('hashed');
      expect(user.id).toBeDefined();
    });

    it('should throw ConflictException for duplicate email', async () => {
      await repository.create({
        email: 'alice@example.com',
        passwordHash: 'hashed',
      });
      await expect(
        repository.create({
          email: 'alice@example.com',
          passwordHash: 'other',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findByEmail', () => {
    it('should return user when found', async () => {
      await repository.create({
        email: 'alice@example.com',
        passwordHash: 'hashed',
      });
      const user = await repository.findByEmail('alice@example.com');
      expect(user).toBeDefined();
      expect(user?.email).toBe('alice@example.com');
    });

    it('should return null when not found', async () => {
      const user = await repository.findByEmail('nobody@example.com');
      expect(user).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      const created = await repository.create({
        email: 'alice@example.com',
        passwordHash: 'hashed',
      });
      const user = await repository.findById(created.id);
      expect(user).toBeDefined();
      expect(user?.id).toBe(created.id);
    });

    it('should return null when not found', async () => {
      const user = await repository.findById('non-existent');
      expect(user).toBeNull();
    });
  });
});
