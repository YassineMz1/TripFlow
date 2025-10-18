import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const corsOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_BASE_URL)
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

 app.enableCors({
  origin: corsOrigins.length > 0 ? corsOrigins : true,
  credentials: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  allowedHeaders: 'Content-Type, Authorization',
  exposedHeaders: 'Authorization',
});

  const preferredPort = parseInt(process.env.PORT ?? '3000', 10);
  let portToUse = preferredPort;
  try {
    await app.listen(portToUse , '0.0.0.0');
  } catch (err: any) {
    if (err && err.code === 'EADDRINUSE') {
      portToUse = preferredPort + 1;
      // Try a fallback port (e.g., 3001) if 3000 is already in use
      console.warn(`Port ${preferredPort} in use, falling back to ${portToUse}`);
      await app.listen(portToUse);
    } else {
      throw err;
    }
  }
}
bootstrap();
