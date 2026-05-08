import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../../src/app.module';
import { JwtAuthGuard } from './../../src/auth/guards/jwt-auth.guard';
import { Reflector } from '@nestjs/core';
import { DatabaseService } from './../../src/database/database.service';
import { InMemoryOrdersRepository } from './../../src/orders/repositories/in-memory-orders.repository';
import { ORDERS_REPOSITORY } from './../../src/orders/repositories/orders.repository.interface';
import { InMemoryUsersRepository } from './../../src/users/repositories/in-memory-users.repository';
import { USERS_REPOSITORY } from './../../src/users/repositories/users.repository.interface';
import { getAuthToken } from '../helpers/auth-helper';

describe('Orders Webhook (e2e)', () => {
  let app: INestApplication;
  let inMemoryRepo: InMemoryOrdersRepository;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DatabaseService)
      .useValue({
        $connect: jest.fn().mockResolvedValue(undefined),
        $disconnect: jest.fn().mockResolvedValue(undefined),
        order: {
          create: jest.fn(),
          findMany: jest.fn(),
          findUnique: jest.fn(),
          update: jest.fn(),
        },
        shippingCostDay: {
          findUnique: jest.fn(),
        },
      })
      .overrideProvider(ORDERS_REPOSITORY)
      .useClass(InMemoryOrdersRepository)
      .overrideProvider(USERS_REPOSITORY)
      .useClass(InMemoryUsersRepository)
      .compile();

    inMemoryRepo =
      moduleFixture.get<InMemoryOrdersRepository>(ORDERS_REPOSITORY);

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

  describe('PATCH /orders/webhook/update-status', () => {
    it('should recalculate settlement for COD DELIVERED', async () => {
      // Seed shipping cost for Monday (day 1)
      inMemoryRepo.seedShippingCost(1, 5.0);

      // Create order via API
      const token = await getAuthToken(
        app,
        'webhook-test@example.com',
        'Secure123!',
      );
      const createRes = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          recipient: {
            name: 'Alice',
            phone: '+50377777777',
            address: '123 Main St',
            city: 'City',
            state: 'State',
            zipCode: '12345',
          },
          products: [
            { name: 'Widget', quantity: 1, unitPrice: 8000.0, weight: 1.0 },
          ],
          isCOD: true,
          deliveryDate: '2026-05-11',
          shippingType: 'STANDARD',
        })
        .expect(201);

      const orderId = createRes.body.id;
      const originalSettlement = createRes.body.settlementAmount;
      expect(originalSettlement).toBeCloseTo(8000.0 + 5.0 - 0.8, 5);

      // Call webhook
      const webhookRes = await request(app.getHttpServer())
        .patch('/orders/webhook/update-status')
        .send({
          orderId,
          status: 'DELIVERED',
          actualRecollectedAmount: 8000.0,
        })
        .expect(200);

      expect(webhookRes.body.status).toBe('DELIVERED');
      expect(webhookRes.body.actualRecollectedAmount).toBe(8000.0);
      expect(webhookRes.body.settlementAmount).toBeCloseTo(
        8000.0 + 5.0 - 0.8,
        5,
      );
    });

    it('should update status without changing settlement for non-COD', async () => {
      inMemoryRepo.seedShippingCost(1, 5.0);

      const token = await getAuthToken(
        app,
        'webhook-noncod@example.com',
        'Secure123!',
      );
      const createRes = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          recipient: {
            name: 'Bob',
            phone: '+50377777777',
            address: '456 Oak Ave',
            city: 'City',
            state: 'State',
            zipCode: '12345',
          },
          products: [
            { name: 'Gadget', quantity: 1, unitPrice: 100.0, weight: 1.0 },
          ],
          isCOD: false,
          deliveryDate: '2026-05-11',
          shippingType: 'STANDARD',
        })
        .expect(201);

      const orderId = createRes.body.id;
      const originalSettlement = createRes.body.settlementAmount;

      const webhookRes = await request(app.getHttpServer())
        .patch('/orders/webhook/update-status')
        .send({
          orderId,
          status: 'DELIVERED',
          actualRecollectedAmount: 100.0,
        })
        .expect(200);

      expect(webhookRes.body.status).toBe('DELIVERED');
      expect(webhookRes.body.settlementAmount).toBe(originalSettlement);
    });

    it('should return 400 for invalid webhook payload', async () => {
      await request(app.getHttpServer())
        .patch('/orders/webhook/update-status')
        .send({
          orderId: 'not-a-valid-id',
          status: 'INVALID',
          actualRecollectedAmount: -10,
        })
        .expect(400);
    });
  });
});
