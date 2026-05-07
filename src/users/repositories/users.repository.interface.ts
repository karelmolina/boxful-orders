import { User } from '../entities/user.entity';

export interface IUsersRepository {
  create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
}

export const USERS_REPOSITORY = Symbol('USERS_REPOSITORY');
