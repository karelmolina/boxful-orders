import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { JwtAuthGuard } from './../src/auth/guards/jwt-auth.guard';
import { Reflector } from '@nestjs/core';
import { getAuthToken } from './helpers/auth-helper';
import { DatabaseService } from './../src/database/database.service';
import { InMemoryUsersRepository } from './../src/users/repositories/in-memory-users.repository';
import { USERS_REPOSITORY } from './../src/users/repositories/users.repository.interface';

const validRegisterPayload = {
  firstName: 'Alice',
  lastName: 'Smith',
  gender: 'female',
  dateOfBirth: '1990-01-01',
  email: 'alice@example.com',
  phoneNumber: '+50377777777',
  password: 'Secure123',
  confirmPassword: 'Secure123',
};

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DatabaseService)
      .useValue({
        $connect: jest.fn().mockResolvedValue(undefined),
        $disconnect: jest.fn().mockResolvedValue(undefined),
        user: {
          create: jest.fn(),
          findUnique: jest.fn(),
        },
      })
      .overrideProvider(USERS_REPOSITORY)
      .useClass(InMemoryUsersRepository)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    app.useGlobalGuards(new JwtAuthGuard(app.get(Reflector)));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('should register a new user', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(validRegisterPayload)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('email', 'alice@example.com');
          expect(res.body).toHaveProperty('firstName', 'Alice');
          expect(res.body).toHaveProperty('lastName', 'Smith');
          expect(res.body).not.toHaveProperty('password');
          expect(res.body).not.toHaveProperty('passwordHash');
        });
    });

    it('should return 400 for invalid email', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...validRegisterPayload, email: 'not-an-email' })
        .expect(400);
    });

    it('should return 400 for short password', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...validRegisterPayload,
          password: 'short',
          confirmPassword: 'short',
        })
        .expect(400);
    });

    it('should return 400 when passwords do not match', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...validRegisterPayload, confirmPassword: 'DifferentPass' })
        .expect(400);
    });

    it('should return 409 for duplicate email', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(validRegisterPayload)
        .expect(201);

      return request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...validRegisterPayload, email: 'alice@example.com' })
        .expect(409);
    });
  });

  describe('POST /auth/login', () => {
    it('should return access_token on valid credentials', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(validRegisterPayload);

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'alice@example.com', password: 'Secure123' })
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(typeof response.body.access_token).toBe('string');
    });

    it('should return 401 for wrong password', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(validRegisterPayload);

      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'alice@example.com', password: 'WrongPass' })
        .expect(401);
    });

    it('should return 401 for non-existent user', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'nobody@example.com', password: 'Secure123' })
        .expect(401);
    });
  });

  describe('GET /auth/profile', () => {
    it('should return 200 and user email with valid Bearer token', async () => {
      const token = await getAuthToken(
        app,
        'profile-test@example.com',
        'Secure123!',
      );

      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('email', 'profile-test@example.com');
    });

    it('should return 401 without token', () => {
      return request(app.getHttpServer()).get('/auth/profile').expect(401);
    });

    it('should return 401 with Bearer invalid-token', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should return 401 with malformed Authorization header', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'NotBearer token')
        .expect(401);
    });
  });

  describe('Public routes', () => {
    it('should allow access to public route without token', () => {
      return request(app.getHttpServer()).get('/').expect(200);
    });
  });
});
