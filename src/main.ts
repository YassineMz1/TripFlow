import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

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

  // Register global exception filter to normalize error responses
  app.useGlobalFilters(new HttpExceptionFilter());

  const preferredPort = parseInt(process.env.PORT ?? '3000', 10);
  let portToUse = preferredPort;

  // If FORCE_KILL_PORT=true, attempt to detect and kill the process occupying the port (Windows-only helper)
  const forceKill = (process.env.FORCE_KILL_PORT || 'false').toLowerCase() === 'true';

  async function tryListen(port: number) {
    try {
      await app.listen(port);
      return true;
    } catch (err: any) {
      if (err && err.code === 'EADDRINUSE') return false;
      throw err;
    }
  }

  if (await tryListen(portToUse)) {
    return;
  }


  if (forceKill) {
    try {
      // Spawn PowerShell to find and kill the process occupying the port (best-effort)
      const { execSync } = await import('child_process');
      // Find OwningProcess for the TCP connection
      const cmd = `powershell -NoProfile -Command "(Get-NetTCPConnection -LocalPort ${portToUse} -ErrorAction SilentlyContinue).OwningProcess | ForEach-Object { $_ }"`;
      const out = execSync(cmd, { encoding: 'utf8' }).trim();
      if (out) {
        const pid = parseInt(out.split(/[\r\n]/).filter(Boolean)[0], 10);
        if (!Number.isNaN(pid)) {
          try {
            execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
          } catch (killErr) {
          }
        }
      }
    } catch (e) {
    }

    // Try listening again
    if (await tryListen(portToUse)) return;
  }

  // Fallback — try next port
  portToUse = preferredPort + 1;
  await app.listen(portToUse, '0.0.0.0');
}
bootstrap();
