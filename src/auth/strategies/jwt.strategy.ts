import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: string;
  email: string;
  firstName: string;
  lastName: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  validate(payload: JwtPayload): {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
  } {
    return {
      userId: payload.sub,
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
    };
  }
}
