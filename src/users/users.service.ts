import { Injectable, ConflictException, Inject } from '@nestjs/common';
import {
  USERS_REPOSITORY,
  type IUsersRepository,
} from './repositories/users.repository.interface';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
  ) {}

  async create(email: string, passwordHash: string): Promise<User> {
    try {
      return await this.usersRepository.create({ email, passwordHash });
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new ConflictException('Email already registered');
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email);
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findById(id);
  }
}
