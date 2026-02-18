import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

import helmet from 'helmet';

async function bootstrap() {
      const app = await NestFactory.create(AppModule);

      // 1. Security Headers (Helmet)
      app.use(helmet());

      // 2. ValidationPipe global
      app.useGlobalPipes(
            new ValidationPipe({
                  whitelist: true,
                  forbidNonWhitelisted: true,
                  transform: true,
            }),
      );

      // 3. Global Exception Filter
      app.useGlobalFilters(new HttpExceptionFilter());

      // 3. Prefixo global
      app.setGlobalPrefix('api/v1');

      // 4. CORS Strict
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      app.enableCors({
            origin: frontendUrl.split(','), // Permite múltiplos domínios separados por vírgula
            methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
            credentials: true,
      });

      // 4. Swagger (OpenAPI)
      const config = new DocumentBuilder()
            .setTitle('French LMS API')
            .setDescription('The French LMS API description')
            .setVersion('1.0')
            .build();
      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('api/docs', app, document);

      await app.listen(3000);
}
bootstrap();
