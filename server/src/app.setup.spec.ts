import { ConfigService } from '@nestjs/config';
import { swaggerEnabled } from './app.setup';

const config = (env: Record<string, string>) => new ConfigService(env);

describe('swaggerEnabled', () => {
  it('is on in development and off in production by default', () => {
    expect(swaggerEnabled(config({}))).toBe(true);
    expect(swaggerEnabled(config({ NODE_ENV: 'development' }))).toBe(true);
    expect(swaggerEnabled(config({ NODE_ENV: 'production' }))).toBe(false);
  });

  it('SWAGGER=true/false overrides NODE_ENV', () => {
    expect(
      swaggerEnabled(config({ NODE_ENV: 'production', SWAGGER: 'true' })),
    ).toBe(true);
    expect(swaggerEnabled(config({ SWAGGER: ' FALSE ' }))).toBe(false);
  });
});
