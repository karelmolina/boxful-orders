import { Injectable, ConflictException } from '@nestjs/common';
import { IUsersRepository } from './users.repository.interface';
import { User } from '../entities/user.entity';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class UsersRepository implements IUsersRepository {
  constructor(private readonly prisma: DatabaseService) {}

  async create(
    userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<User> {
    try {
      const prismaUser = await this.prisma.user.create({ data: userData });
      return prismaUser;
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictException('Email already registered');
      }
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    const prismaUser = await this.prisma.user.findUnique({ where: { email } });
    return prismaUser ?? null;
  }

  async findById(id: string): Promise<User | null> {
    const prismaUser = await this.prisma.user.findUnique({ where: { id } });
    return prismaUser ?? null;
  }
}
