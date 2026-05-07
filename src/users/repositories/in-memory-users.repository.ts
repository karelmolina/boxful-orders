import { Injectable } from '@nestjs/common';
import { ConflictException } from '@nestjs/common';
import { IUsersRepository } from './users.repository.interface';
import { User } from '../entities/user.entity';

@Injectable()
export class InMemoryUsersRepository implements IUsersRepository {
  private readonly users: User[] = [];

  async create(
    userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<User> {
    const existing = await this.findByEmail(userData.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const user: User = {
      id: crypto.randomUUID(),
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.push(user);
    return user;
  }

  findByEmail(email: string): Promise<User | null> {
    const user = this.users.find((u) => u.email === email);
    return Promise.resolve(user ?? null);
  }

  findById(id: string): Promise<User | null> {
    const user = this.users.find((u) => u.id === id);
    return Promise.resolve(user ?? null);
  }
}
