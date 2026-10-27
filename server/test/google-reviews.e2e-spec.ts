import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { GoogleReviewsResponseDto } from '../src/google-reviews/dto/google-review.dto';
import { importGoogleReviews } from '../scripts/import-google-reviews';
import { seedCafes } from '../scripts/seed';

describe('Google reviews API (e2e)', () => {
  let mongo: MongoMemoryServer;
  let app: INestApplication<App>;
  let imported: number;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongo.getUri('brewmap');
    await seedCafes(process.env.MONGODB_URI);
    imported = await importGoogleReviews(process.env.MONGODB_URI);
    // Running it again replaces rather than duplicates.
    await importGoogleReviews(process.env.MONGODB_URI);

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  }, 120_000);

  afterAll(async () => {
    await app?.close();
    await mongo?.stop();
  });

  const get = (path: string) => request(app.getHttpServer()).get(path);

  it('imports the scraped reviews that have text and stars', () => {
    expect(imported).toBeGreaterThan(800);
  });

  it("lists a café's reviews newest first, without reviewer details or replies", async () => {
    const res = await get(
      '/api/cafes/the-baristro-asian-style/google-reviews',
    ).expect(200);
    const body = res.body as GoogleReviewsResponseDto;

    expect(body.total).toBe(body.items.length);
    expect(body.items.length).toBeGreaterThan(0);
    expect(body.items.length).toBeLessThanOrEqual(5);
    for (const review of body.items) {
      expect(Object.keys(review).sort()).toEqual(
        ['language', 'publishedAt', 'rating', 'text', 'translatedText'].sort(),
      );
      expect(review.rating).toBeGreaterThanOrEqual(1);
      expect(review.rating).toBeLessThanOrEqual(5);
      expect(review.text.trim()).not.toBe('');
    }
    const dates = body.items.map((r) => r.publishedAt ?? '');
    expect(dates).toEqual([...dates].sort().reverse());
    expect(JSON.stringify(body)).not.toMatch(
      /reply|ProfilePicture|author_url|"Name"/i,
    );
  });

  it('keeps the original text and an English translation for Thai reviews', async () => {
    let thai: GoogleReviewsResponseDto['items'][number] | undefined;
    for (let page = 1; page <= 4 && !thai; page++) {
      const { items: cafes } = (
        await get(`/api/cafes?limit=50&page=${page}`).expect(200)
      ).body as { items: { slug: string }[] };
      for (const { slug } of cafes) {
        const { items } = (await get(`/api/cafes/${slug}/google-reviews`))
          .body as GoogleReviewsResponseDto;
        thai = items.find((r) => r.language === 'th');
        if (thai) break;
      }
    }
    expect(thai?.text).toMatch(/[฀-๿]/);
    expect(thai?.translatedText).toMatch(/[a-z]/i);
  });

  it('unknown café -> 404', async () => {
    await get('/api/cafes/no-such-cafe/google-reviews').expect(404);
  });
});
