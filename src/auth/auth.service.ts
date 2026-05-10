import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(userData: {
    firstName: string;
    lastName: string;
    gender: string;
    dateOfBirth: string;
    email: string;
    phoneNumber: string;
    password: string;
  }): Promise<Omit<User, 'passwordHash'>> {
    const { password, ...rest } = userData;
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await this.usersService.create({
      ...rest,
      dateOfBirth: new Date(rest.dateOfBirth),
      passwordHash,
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _, ...result } = user;
    return result;
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<Omit<User, 'passwordHash'> | null> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return null;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = user;
    return result;
  }

  login(user: Omit<User, 'passwordHash'>): { access_token: string } {
    const payload = {
      sub: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
