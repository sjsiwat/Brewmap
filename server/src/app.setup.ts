import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import type { Application } from 'express';

/** HTTP-level config shared by main.ts and the e2e tests, so tests run the real setup. */
export function configureApp(app: INestApplication): void {
  const config = app.get(ConfigService);

  // Express "trust proxy": how many proxies sit in front of us (e.g. 1 for
  // Render's load balancer), so req.ip is the caller and not the proxy. Off by
  // default - trusting X-Forwarded-For with no proxy lets callers spoof it.
  const trustProxy = config.get<string>('TRUST_PROXY')?.trim();
  if (trustProxy && trustProxy !== 'false') {
    (app.getHttpAdapter().getInstance() as Application).set(
      'trust proxy',
      // A hop count, `true`, or an address/subnet list as Express accepts it.
      /^\d+$/.test(trustProxy)
        ? Number(trustProxy)
        : trustProxy === 'true' || trustProxy,
    );
  }

  // Don't advertise the framework.
  (app.getHttpAdapter().getInstance() as Application).disable('x-powered-by');

  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.enableCors({
    origin: config.get<string>('WEB_ORIGIN', 'http://localhost:3000'),
    // Required so the browser sends the httpOnly JWT cookie.
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
}

/** SWAGGER=true/false wins; otherwise docs are on everywhere but production. */
export function swaggerEnabled(config: ConfigService): boolean {
  const flag = config.get<string>('SWAGGER')?.trim().toLowerCase();
  if (flag === 'true') return true;
  if (flag === 'false') return false;
  return config.get<string>('NODE_ENV') !== 'production';
}
