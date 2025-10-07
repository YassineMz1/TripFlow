import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Enable CORS for your frontend origin(s)
  const corsOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_BASE_URL || 'http://localhost:3001')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow non-browser requests (no Origin) and allowed origins
      if (!origin || corsOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Not allowed by CORS: ${origin}`), false);
      }
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization',
    exposedHeaders: 'Authorization',
  });

  const preferredPort = parseInt(process.env.PORT ?? '3000', 10);
  let portToUse = preferredPort;
  try {
    await app.listen(portToUse);
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
  console.log(`API listening on http://localhost:${portToUse}`);
}
bootstrap();
