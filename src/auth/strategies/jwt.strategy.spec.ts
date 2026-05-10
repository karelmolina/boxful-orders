import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue('test-secret'),
          },
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  describe('validate', () => {
    it('should return userId, email, firstName and lastName from payload', async () => {
      const payload = {
        sub: 'user-id',
        email: 'alice@example.com',
        firstName: 'Alice',
        lastName: 'Smith',
      };

      const result = strategy.validate(payload);

      expect(result).toEqual({
        userId: 'user-id',
        email: 'alice@example.com',
        firstName: 'Alice',
        lastName: 'Smith',
      });
    });
  });
});
