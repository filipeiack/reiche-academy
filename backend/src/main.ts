import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  // CORS - Configurar ANTES de outros middlewares
  app.enableCors({
    origin: configService.get('CORS_ORIGIN', 'http://localhost:4200'),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Security - Helmet com configurações relaxadas para imagens
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false,
    })
  );
  app.use(compression());

  // Serve static files from public folder
  app.useStaticAssets(join(__dirname, '..', 'public'), {
    prefix: '/',
    setHeaders: (res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    },
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
  const host = configService.get('HOST', '0.0.0.0');
  
  console.log(`🔧 Attempting to bind to ${host}:${port}...`);
  
  try {
    await app.listen(port, host);
    
    console.log(`✅ Server is now listening on ${host}:${port}`);
    console.log(`
  🚀 Reiche Academy API is running!
  
  📝 API: http://localhost:${port}/${apiPrefix}
  📚 Swagger: http://localhost:${port}/${apiPrefix}/docs
  🌍 Environment: ${configService.get('NODE_ENV')}
  🔗 Listening on: ${host}:${port}
    `);
    
    // Keep process alive
    process.on('SIGINT', () => {
      console.log('\n🛑 Received SIGINT, shutting down gracefully...');
      app.close().then(() => process.exit(0));
    });
    
    process.on('SIGTERM', () => {
      console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
      app.close().then(() => process.exit(0));
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap().catch((error) => {
  console.error('❌ Bootstrap failed:', error);
  process.exit(1);
});
