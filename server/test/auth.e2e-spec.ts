import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { CafeResponseDto } from '../src/cafes/dto/cafe-response.dto';
import { UserResponseDto } from '../src/users/user-response.dto';
import { seedCafes } from '../scripts/seed';

const USER = {
  email: 'siwat@example.com',
  password: 'correct-horse-9',
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

    it('enforces the email, password and name rules -> 400', async () => {
      const ok = {
        email: 'rules@example.com',
        password: 'Brew1234',
        displayName: 'Ploy',
      };
      const bad: Record<string, unknown>[] = [
        // email
        { ...ok, email: 'plainaddress' },
        { ...ok, email: 'no-tld@example' },
        { ...ok, email: 'two@@example.com' },
        { ...ok, email: '.dot@example.com' },
        { ...ok, email: 'dot.@example.com' },
        { ...ok, email: 'dou..ble@example.com' },
        { ...ok, email: 'space in@example.com' },
        { ...ok, email: 'ไทย@example.com' },
        { ...ok, email: 'user@ตัวอย่าง.com' },
        { ...ok, email: 'user@-bad.com' },
        { ...ok, email: 'user@[127.0.0.1]' },
        { ...ok, email: 'Name <user@example.com>' },
        { ...ok, email: `${'a'.repeat(250)}@x.co` },
        // password
        { ...ok, password: 'รหัสผ่าน1234' },
        { ...ok, password: 'Brew1234ก' },
        { ...ok, password: 'Brew 1234' },
        { ...ok, password: 'Brew1234☕' },
        { ...ok, password: 'Brew123' },
        { ...ok, password: 'brewmapcafe' },
        { ...ok, password: '12345678' },
        { ...ok, password: `A1${'x'.repeat(71)}` },
        // name
        { ...ok, displayName: 'P' },
        { ...ok, displayName: '   ' },
        { ...ok, displayName: 'x'.repeat(31) },
        { ...ok, displayName: '<script>' },
        { ...ok, displayName: 'Ploy ☕' },
        { ...ok, displayName: '-Ploy' },
        { ...ok, displayName: 'Ploy\u200bP' },
        { ...ok, displayName: 'Ploy\u0000P' },
      ];
      // Each case comes from its own forwarded visitor, so the 10/min register
      // limit doesn't turn the later cases into 429s.
      process.env.PROXY_SECRET = 'e2e-rules-secret';
      try {
        for (const [i, body] of bad.entries()) {
          const res = await http()
            .post('/api/auth/register')
            .set({
              'x-client-ip': `198.51.100.${i + 1}`,
              'x-proxy-secret': 'e2e-rules-secret',
            })
            .send(body);
          expect({ body, status: res.status }).toEqual({ body, status: 400 });
        }
      } finally {
        delete process.env.PROXY_SECRET;
      }
    });

    it('accepts well-formed values and normalises them', async () => {
      const res = await http()
        .post('/api/auth/register')
        .send({
          email: '  First.Last+cafe@Mail.Example.co.th ',
          password: `Aa1!${'x'.repeat(68)}`,
          displayName: "  ปลาย   O'Neil-Brew_2.  ",
        })
        .expect(201);
      expect(res.body).toMatchObject({
        email: 'first.last+cafe@mail.example.co.th',
        displayName: "ปลาย O'Neil-Brew_2.",
      });
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

    it('logout revokes the token itself, not just the cookie', async () => {
      const loginOnce = () =>
        http()
          .post('/api/auth/login')
          .send({ email: USER.email, password: USER.password })
          .expect(200)
          .then((res) => authCookie(res)!.split(';')[0]);
      const phone = await loginOnce();
      const laptop = await loginOnce();
      await http().get('/api/auth/me').set('Cookie', phone).expect(200);

      // A copy of the phone's cookie, kept after logout, no longer works...
      await http().post('/api/auth/logout').set('Cookie', phone).expect(204);
      await http().get('/api/auth/me').set('Cookie', phone).expect(401);
      await http()
        .put(`/api/me/favorites/${slugs[0]}`)
        .set('Cookie', phone)
        .expect(401);
      // ...and logout signs out every session of that account.
      await http().get('/api/auth/me').set('Cookie', laptop).expect(401);

      // Logging in again issues a fresh token that works.
      const fresh = await loginOnce();
      await http().get('/api/auth/me').set('Cookie', fresh).expect(200);
      // Replaying the old cookie's logout can't revoke the new session.
      await http().post('/api/auth/logout').set('Cookie', phone).expect(204);
      await http().get('/api/auth/me').set('Cookie', fresh).expect(200);
    });

    it('rejects an empty password before checking it -> 400', async () => {
      await http()
        .post('/api/auth/login')
        .send({ email: USER.email, password: '' })
        .expect(400);
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

  it("a deleted account's cookie stops working at once -> 401", async () => {
    const ghost = { ...USER, email: 'ghost@example.com' };
    await http().post('/api/auth/register').send(ghost).expect(201);
    const agent = request.agent(app.getHttpServer());
    await agent
      .post('/api/auth/login')
      .send({ email: ghost.email, password: ghost.password })
      .expect(200);
    await agent.get('/api/auth/me').expect(200);

    const db = await mongoose
      .createConnection(process.env.MONGODB_URI!)
      .asPromise();
    await db.collection('users').deleteOne({ email: ghost.email });
    await db.close();

    await agent.get('/api/auth/me').expect(401);
    await agent.get('/api/me/favorites').expect(401);
    await agent.put(`/api/me/favorites/${slugs[0]}`).expect(401);
  });

  it('rate-limits favorite writes per user, not per IP -> 429', async () => {
    // Own visitor IPs, so this doesn't touch the auth buckets other tests rely on.
    process.env.PROXY_SECRET = 'e2e-write-secret';
    const asVisitor = (ip: string) => ({
      'x-client-ip': ip,
      'x-proxy-secret': 'e2e-write-secret',
    });
    try {
      const sessionFor = async (email: string, ip: string) => {
        const body = { email, password: 'Brew1234', displayName: 'Writer' };
        await http()
          .post('/api/auth/register')
          .set(asVisitor(ip))
          .send(body)
          .expect(201);
        const res = await http()
          .post('/api/auth/login')
          .set(asVisitor(ip))
          .send({ email, password: body.password })
          .expect(200);
        return authCookie(res)!.split(';')[0];
      };
      const busy = await sessionFor(
        'writer-busy@example.com',
        '198.51.100.201',
      );
      const other = await sessionFor(
        'writer-other@example.com',
        '198.51.100.202',
      );

      const put = (cookie: string) =>
        http().put(`/api/me/favorites/${slugs[0]}`).set('Cookie', cookie);
      for (let i = 0; i < 30; i++) await put(busy).expect(204);
      await put(busy).expect(429);
      // Same IP, different account: its own quota.
      await put(other).expect(204);
    } finally {
      delete process.env.PROXY_SECRET;
    }
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

  // Runs after the test above, so this client's own bucket is already full.
  describe('rate limit behind the web proxy', () => {
    const SECRET = 'e2e-proxy-secret';
    const badLogin = { email: USER.email, password: 'wrong-password' };
    const loginAs = (headers: Record<string, string>) =>
      http().post('/api/auth/login').set(headers).send(badLogin);

    beforeAll(() => {
      process.env.PROXY_SECRET = SECRET;
    });
    afterAll(() => {
      delete process.env.PROXY_SECRET;
    });

    it('ignores x-client-ip without the right secret', async () => {
      await loginAs({ 'x-client-ip': '203.0.113.1' }).expect(429);
      await loginAs({
        'x-client-ip': '203.0.113.1',
        'x-proxy-secret': 'wrong-secret!!!!',
      }).expect(429);
      await loginAs({
        'x-client-ip': 'not-an-ip',
        'x-proxy-secret': SECRET,
      }).expect(429);
    });

    it('limits each forwarded visitor separately', async () => {
      const visitorA = {
        'x-client-ip': '203.0.113.10',
        'x-proxy-secret': SECRET,
      };
      const visitorB = {
        'x-client-ip': '203.0.113.20',
        'x-proxy-secret': SECRET,
      };

      for (let i = 0; i < 10; i++) await loginAs(visitorA).expect(401);
      await loginAs(visitorA).expect(429);
      await loginAs(visitorB).expect(401);
    });
  });
});
