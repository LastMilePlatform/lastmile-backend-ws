import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

const defaultCorsOrigins = [
  'http://localhost:8081',
  'http://localhost:19006',
  'http://127.0.0.1:19006',
  'https://chasmic-lavada-pneumatically.ngrok-free.dev',
];

const expoTunnelOriginPattern = /^https:\/\/[a-z0-9-]+-8081\.exp\.direct$/;

const corsOrigins =
  process.env.CORS_ORIGINS?.split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0) ?? defaultCorsOrigins;

const allowedCorsOrigins = new Set(corsOrigins);

const isAllowedCorsOrigin = (origin?: string): boolean => {
  if (!origin) {
    return true;
  }
  return allowedCorsOrigins.has(origin) || expoTunnelOriginPattern.test(origin);
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  const port = Number(process.env.PORT ?? 3003);

  app.setGlobalPrefix('api/v1');

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (isAllowedCorsOrigin(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin not allowed by CORS: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'ngrok-skip-browser-warning',
    ],
    exposedHeaders: ['Authorization'],
    optionsSuccessStatus: 204,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(port);

  const appUrl = await app.getUrl();
  const localhostUrl = appUrl
    .replace('0.0.0.0', 'localhost')
    .replace('[::1]', 'localhost');

  logger.log(`WebSocket Backend iniciado en: ${localhostUrl}`);
  logger.log(`Socket.IO disponible en: ${localhostUrl}/ws`);
}
bootstrap();
