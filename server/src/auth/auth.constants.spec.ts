import { jwtSecret } from './auth.constants';

describe('jwtSecret', () => {
  const strong = 'a'.repeat(32);

  it('accepts a long secret anywhere', () => {
    expect(jwtSecret(strong, 'production')).toBe(strong);
    expect(jwtSecret(strong, 'development')).toBe(strong);
  });

  it.each([
    ['the .env.example placeholder', 'change-me'],
    ['a short secret', 'a'.repeat(31)],
  ])('refuses %s in production', (_, secret) => {
    expect(() => jwtSecret(secret, 'production')).toThrow(/too weak/);
  });

  it('allows a weak secret outside production (local dev, tests)', () => {
    expect(jwtSecret('change-me', 'development')).toBe('change-me');
    expect(jwtSecret('change-me', undefined)).toBe('change-me');
  });

  it('refuses a missing secret everywhere', () => {
    expect(() => jwtSecret(undefined, 'development')).toThrow(/not set/);
    expect(() => jwtSecret('', 'production')).toThrow(/not set/);
  });
});
