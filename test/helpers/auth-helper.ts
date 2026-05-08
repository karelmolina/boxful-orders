import { INestApplication } from '@nestjs/common';
import request from 'supertest';

export async function getAuthToken(
  app: INestApplication,
  email = 'test@example.com',
  password = 'Secure123!',
): Promise<string> {
  await request(app.getHttpServer()).post('/auth/register').send({
    firstName: 'Test',
    lastName: 'User',
    gender: 'other',
    dateOfBirth: '1990-01-01',
    email,
    phoneNumber: '+50377777777',
    password,
    confirmPassword: password,
  });

  const response = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password });

  return response.body.access_token;
}
