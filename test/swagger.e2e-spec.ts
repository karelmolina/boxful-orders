import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { DatabaseService } from './../src/database/database.service';
import { setupSwagger } from './../src/swagger.setup';

describe('Swagger (e2e)', () => {
  let app: INestApplication<App>;

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
      .compile();

    app = moduleFixture.createNestApplication();
    // Note: SwaggerModule.setup middleware does not respect global prefix
    // in the testing environment. In production, main.ts sets prefix 'api'
    // and the UI is served at /api/docs as designed.
    setupSwagger(app);
    await app.init();
  });

  it('GET /docs returns 200 with Swagger UI HTML', () => {
    return request(app.getHttpServer())
      .get('/docs')
      .expect(200)
      .expect('Content-Type', /html/)
      .expect((res) => {
        expect(res.text).toContain('swagger-ui');
      });
  });

  it('GET /docs-json returns valid OpenAPI JSON with paths, schemas, and bearerAuth', () => {
    return request(app.getHttpServer())
      .get('/docs-json')
      .expect(200)
      .expect('Content-Type', /json/)
      .expect((res) => {
        const doc = res.body;
        expect(doc.paths).toBeDefined();
        expect(Object.keys(doc.paths).length).toBeGreaterThan(0);
        expect(doc.components).toBeDefined();
        expect(doc.components.schemas).toBeDefined();
        expect(doc.components.securitySchemes).toBeDefined();
        expect(doc.components.securitySchemes.bearerAuth).toBeDefined();
        expect(doc.components.securitySchemes.bearerAuth.type).toBe('http');
        expect(doc.components.securitySchemes.bearerAuth.scheme).toBe('bearer');
        expect(doc.components.securitySchemes.bearerAuth.bearerFormat).toBe(
          'JWT',
        );
      });
  });

  afterEach(async () => {
    await app.close();
  });

  describe('in production', () => {
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('GET /docs returns 404', async () => {
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
        .compile();

      const prodApp = moduleFixture.createNestApplication();
      setupSwagger(prodApp);
      await prodApp.init();

      await request(prodApp.getHttpServer()).get('/docs').expect(404);

      await prodApp.close();
    });
  });
});
