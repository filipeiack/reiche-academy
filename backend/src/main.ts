import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Security
  app.use(helmet());
  app.use(compression());

  // CORS
  app.enableCors({
    origin: configService.get('CORS_ORIGIN', 'http://localhost:4200'),
    credentials: true,
  });

  // Global prefix
  const apiPrefix = configService.get('API_PREFIX', 'api');
  app.setGlobalPrefix(apiPrefix);

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Reiche Academy API')
    .setDescription('API de Gestão Empresarial PDCA')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Autenticação e autorização')
    .addTag('empresas', 'Gestão de empresas')
    .addTag('usuarios', 'Gestão de usuários')
    .addTag('pilares', 'Gestão de pilares')
    .addTag('rotinas', 'Gestão de rotinas')
    .addTag('diagnosticos', 'Gestão de diagnósticos')
    .addTag('agenda', 'Agenda de reuniões')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get('PORT', 3000);
  await app.listen(port);

  console.log(`
  🚀 Reiche Academy API is running!
  
  📝 API: http://localhost:${port}/${apiPrefix}
  📚 Swagger: http://localhost:${port}/${apiPrefix}/docs
  🌍 Environment: ${configService.get('NODE_ENV')}
  `);
}

bootstrap();
