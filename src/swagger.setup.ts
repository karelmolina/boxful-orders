import { INestApplication } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  const config = new DocumentBuilder()
    .setTitle('Boxful Orders API')
    .setDescription('API documentation for Boxful Orders service')
    .setVersion('1.0')
    .addBearerAuth(undefined, 'bearerAuth')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
}
