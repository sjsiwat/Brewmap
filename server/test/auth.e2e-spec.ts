import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { CafeResponseDto } from '../src/cafes/dto/cafe-response.dto';
import { UserResponseDto } from '../src/users/user-response.dto';
import { seedCafes } from '../scripts/seed';

const USER = {
  email: 'siwat@example.com',
  password: 'correct-horse',
  displayName: 'Siwat',
};

function authCookie(res: request.Response): string | undefined {
  const cookies = res.headers['set-cookie'] as unknown as string[] | undefined;
  return cookies?.find((c) => c.startsWith('access_token='));
}

describe('Auth + Favorites API (e2e)', () => {
  let mongo: MongoMemoryServer;
  let app: INestApplication<App>;
  let slugs: string[];

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongo.getUri('brewmap');
    process.env.JWT_SECRET = 'e2e-test-secret';
    await seedCafes(process.env.MONGODB_URI);

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    const res = await request(app.getHttpServer()).get('/api/cafes?limit=3');
    slugs = (res.body as { items: CafeResponseDto[] }).items.map((c) => c.slug);
  }, 120_000);

  afterAll(async () => {
    await app?.close();
    await mongo?.stop();
  });

  const http = () => request(app.getHttpServer());

  describe('register', () => {
    it('creates the account without exposing the password hash', async () => {
      const res = await http()
        .post('/api/auth/register')
        .send(USER)
        .expect(201);
      const user = res.body as UserResponseDto;
      expect(user).toMatchObject({
        email: USER.email,
        displayName: USER.displayName,
        role: 'user',
      });
      expect(res.body).not.toHaveProperty('passwordHash');
      expect(authCookie(res)).toBeUndefined();
    });

    it('rejects a duplicate email regardless of case -> 409', async () => {
      await http()
        .post('/api/auth/register')
        .send({ ...USER, email: '  SIWAT@example.com ' })
        .expect(409);
    });

    it('validates the body -> 400', async () => {
      const bad = [
        { ...USER, email: 'new@example.com', password: 'short' },
        { ...USER, email: 'not-an-email' },
        { ...USER, email: 'new@example.com', displayName: '   ' },
        { ...USER, email: 'new@example.com', role: 'admin' },
      ];
      for (const body of bad) {
        await http().post('/api/auth/register').send(body).expect(400);
      }
    });
  });

  describe('login / me / logout', () => {
    it('wrong password and unknown email get the same 401', async () => {
      const wrongPassword = await http()
        .post('/api/auth/login')
        .send({ email: USER.email, password: 'wrong-password' })
        .expect(401);
      const unknownEmail = await http()
        .post('/api/auth/login')
        .send({ email: 'nobody@example.com', password: USER.password })
        .expect(401);
      expect(wrongPassword.body).toEqual(unknownEmail.body);
      expect(authCookie(wrongPassword)).toBeUndefined();
    });

    it('login sets an httpOnly cookie that /me accepts; logout clears it', async () => {
      const agent = request.agent(app.getHttpServer());
      const login = await agent
        .post('/api/auth/login')
        .send({ email: 'Siwat@Example.com', password: USER.password })
        .expect(200);
      const cookie = authCookie(login);
      expect(cookie).toMatch(/HttpOnly/);
      expect(cookie).toMatch(/SameSite=Lax/);
      expect(cookie).toMatch(/Max-Age=604800/);
      expect(cookie).not.toMatch(/Secure/);

      const me = await agent.get('/api/auth/me').expect(200);
      expect((me.body as UserResponseDto).email).toBe(USER.email);
      expect(me.body).not.toHaveProperty('passwordHash');

      const logout = await agent.post('/api/auth/logout').expect(204);
      expect(authCookie(logout)).toMatch(/Expires=Thu, 01 Jan 1970/);
      await agent.get('/api/auth/me').expect(401);
      // Logging out again is fine.
      await agent.post('/api/auth/logout').expect(204);
    });

    it('/me without a valid cookie -> 401', async () => {
      await http().get('/api/auth/me').expect(401);
      await http()
        .get('/api/auth/me')
        .set('Cookie', 'access_token=not-a-jwt')
        .expect(401);
    });
  });

  describe('favorites', () => {
    let agent: ReturnType<typeof request.agent>;

    beforeAll(async () => {
      agent = request.agent(app.getHttpServer());
      await agent
        .post('/api/auth/login')
        .send({ email: USER.email, password: USER.password })
        .expect(200);
    });

    it('requires login -> 401', async () => {
      await http().get('/api/me/favorites').expect(401);
      await http().put(`/api/me/favorites/${slugs[0]}`).expect(401);
      await http().delete(`/api/me/favorites/${slugs[0]}`).expect(401);
    });

    it('adds idempotently and lists newest first', async () => {
      await agent.put(`/api/me/favorites/${slugs[0]}`).expect(204);
      await agent.put(`/api/me/favorites/${slugs[1]}`).expect(204);
      await agent.put(`/api/me/favorites/${slugs[0]}`).expect(204);

      const res = await agent.get('/api/me/favorites').expect(200);
      expect((res.body as CafeResponseDto[]).map((c) => c.slug)).toEqual([
        slugs[1],
        slugs[0],
      ]);
    });

    it('removes idempotently', async () => {
      await agent.delete(`/api/me/favorites/${slugs[1]}`).expect(204);
      await agent.delete(`/api/me/favorites/${slugs[1]}`).expect(204);
      await agent.delete(`/api/me/favorites/${slugs[2]}`).expect(204);

      const res = await agent.get('/api/me/favorites').expect(200);
      expect((res.body as CafeResponseDto[]).map((c) => c.slug)).toEqual([
        slugs[0],
      ]);
    });

    it('unknown café -> 404', async () => {
      await agent.put('/api/me/favorites/no-such-cafe').expect(404);
      await agent.delete('/api/me/favorites/no-such-cafe').expect(404);
    });

    it("keeps each user's favorites separate", async () => {
      const other = { ...USER, email: 'other@example.com' };
      await http().post('/api/auth/register').send(other).expect(201);
      const otherAgent = request.agent(app.getHttpServer());
      await otherAgent
        .post('/api/auth/login')
        .send({ email: other.email, password: other.password })
        .expect(200);

      const res = await otherAgent.get('/api/me/favorites').expect(200);
      expect(res.body).toEqual([]);
    });
  });

  // Last: it uses up the login rate limit for this client.
  it('rate-limits login -> 429', async () => {
    let status = 0;
    for (let i = 0; i < 12 && status !== 429; i++) {
      const res = await http()
        .post('/api/auth/login')
        .send({ email: USER.email, password: 'wrong-password' });
      status = res.status;
    }
    expect(status).toBe(429);
  });
});
