import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import {
  CafeResponseDto,
  PaginatedCafesDto,
} from '../src/cafes/dto/cafe-response.dto';
import { importOpeningHours } from '../scripts/import-opening-hours';
import { seedCafes } from '../scripts/seed';
import { isOpenAt } from '../src/cafes/opening-hours';

// Tha Phae Gate
const ORIGIN = { lat: 18.7876, lng: 98.9933 };

describe('Cafes API (e2e)', () => {
  let mongo: MongoMemoryServer;
  let app: INestApplication<App>;
  let seeded: number;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongo.getUri('brewmap');
    seeded = await seedCafes(process.env.MONGODB_URI);

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

  it('seed is idempotent', async () => {
    expect(await seedCafes(process.env.MONGODB_URI!)).toBe(seeded);
    const res = await get('/api/cafes?limit=1').expect(200);
    expect((res.body as PaginatedCafesDto).total).toBe(seeded);
  });

  it('GET /api/health reports the database', async () => {
    const res = await get('/api/health').expect(200);
    expect(res.body).toEqual({ status: 'ok', database: 'connected' });
  });

  it('lists cafés sorted by rating with pagination', async () => {
    const res = await get('/api/cafes?limit=5&page=2').expect(200);
    const body = res.body as PaginatedCafesDto;
    expect(body.items).toHaveLength(5);
    expect(body.page).toBe(2);
    const ratings = body.items.map((c) => c.rating);
    expect(ratings).toEqual([...ratings].sort((a, b) => b - a));
    expect(body.items[0]).not.toHaveProperty('distanceKm');
    expect(body.items[0]).not.toHaveProperty('location');
  });

  it('filters by price, drink type and booleans', async () => {
    const res = await get(
      '/api/cafes?maxPrice=100&drinkType=Coffee&parking=false&limit=50',
    ).expect(200);
    const body = res.body as PaginatedCafesDto;
    expect(body.total).toBeGreaterThan(0);
    for (const cafe of body.items) {
      expect(cafe.priceAvg).toBeLessThanOrEqual(100);
      expect(cafe.drinkType).toBe('Coffee');
      expect(cafe.parking).toBe(false);
    }
  });

  it('filters by lowest rating and fewest reviews, with the distance sort', async () => {
    const all = await get('/api/cafes?limit=1').expect(200);
    const res = await get(
      `/api/cafes?minRating=4.8&minReviews=300&lat=${ORIGIN.lat}&lng=${ORIGIN.lng}&sort=distance&limit=50`,
    ).expect(200);
    const body = res.body as PaginatedCafesDto;
    expect(body.total).toBeGreaterThan(0);
    expect(body.total).toBeLessThan((all.body as PaginatedCafesDto).total);
    for (const cafe of body.items) {
      expect(cafe.rating).toBeGreaterThanOrEqual(4.8);
      expect(cafe.reviewCount).toBeGreaterThanOrEqual(300);
    }
    const km = body.items.map((cafe) => cafe.distanceKm!);
    expect(km).toEqual([...km].sort((a, b) => a - b));

    await get('/api/cafes?minRating=6').expect(400);
    await get('/api/cafes?minReviews=-1').expect(400);
    await get('/api/cafes?minReviews=1.5').expect(400);
  });

  it('parking=true returns only cafés with parking', async () => {
    const res = await get('/api/cafes?parking=true&limit=50').expect(200);
    const body = res.body as PaginatedCafesDto;
    expect(body.items.every((c) => c.parking)).toBe(true);
  });

  it('geo query returns distance, sorted nearest first, within radius', async () => {
    const res = await get(
      `/api/cafes?lat=${ORIGIN.lat}&lng=${ORIGIN.lng}&radiusKm=2&limit=50`,
    ).expect(200);
    const body = res.body as PaginatedCafesDto;
    expect(body.total).toBeGreaterThan(0);
    expect(body.total).toBeLessThan(seeded);
    const distances = body.items.map((c) => c.distanceKm!);
    expect(distances.every((d) => d <= 2)).toBe(true);
    expect(distances).toEqual([...distances].sort((a, b) => a - b));
  });

  it('sort=recommended weights rating by review count, with or without coordinates', async () => {
    const all = await get('/api/cafes?sort=recommended&limit=50').expect(200);
    const body = all.body as PaginatedCafesDto;
    expect(body.total).toBe(seeded);
    expect(body.items[0]).not.toHaveProperty('score');

    // A 5.0 with few reviews must not outrank a 4.9 with thousands.
    const position = (predicate: (c: CafeResponseDto) => boolean) =>
      body.items.findIndex(predicate);
    const fewFive = position((c) => c.rating === 5 && c.reviewCount < 100);
    const manyNearFive = position(
      (c) => c.rating >= 4.9 && c.reviewCount >= 2000,
    );
    expect(manyNearFive).toBeGreaterThanOrEqual(0);
    if (fewFive >= 0) expect(manyNearFive).toBeLessThan(fewFive);

    const geo = await get(
      `/api/cafes?sort=recommended&lat=${ORIGIN.lat}&lng=${ORIGIN.lng}&radiusKm=3&limit=50`,
    ).expect(200);
    const geoBody = geo.body as PaginatedCafesDto;
    expect(geoBody.total).toBeGreaterThan(0);
    expect(geoBody.items.every((c) => c.distanceKm! <= 3)).toBe(true);
    const slugs = body.items.map((c) => c.slug);
    const geoOrder = geoBody.items
      .map((c) => slugs.indexOf(c.slug))
      .filter((i) => i >= 0);
    expect(geoOrder).toEqual([...geoOrder].sort((a, b) => a - b));
  });

  it('imports weekly opening hours and filters by open now', async () => {
    const before = await get('/api/cafes?limit=1').expect(200);
    expect((before.body as PaginatedCafesDto).items[0].openingHours).toBeNull();
    // Before the import nothing has hours, so nothing counts as open.
    const noneYet = await get('/api/cafes?openNow=true&limit=1').expect(200);
    expect((noneYet.body as PaginatedCafesDto).total).toBe(0);

    const { imported, unreadable } = await importOpeningHours(
      process.env.MONGODB_URI!,
    );
    expect(imported + unreadable).toBe(seeded);
    expect(imported).toBeGreaterThan(seeded * 0.9);
    // Repeating it changes nothing.
    expect(await importOpeningHours(process.env.MONGODB_URI!)).toEqual({
      imported,
      unreadable,
    });

    const all = await get('/api/cafes?limit=50').expect(200);
    const sample = (all.body as PaginatedCafesDto).items.find(
      (c) => c.openingHours,
    )!;
    expect(Object.keys(sample.openingHours![0]).sort()).toEqual([
      'close',
      'day',
      'open',
    ]);

    // openNow agrees with isOpenAt for every café, open or not.
    const now = new Date();
    const open = await get('/api/cafes?openNow=true&limit=50').expect(200);
    const openBody = open.body as PaginatedCafesDto;
    expect(
      openBody.items.every((c) => isOpenAt(c.openingHours ?? [], now)),
    ).toBe(true);
    const everyCafe: CafeResponseDto[] = [];
    for (let page = 1; everyCafe.length < seeded; page++) {
      const res = await get(`/api/cafes?limit=50&page=${page}`).expect(200);
      everyCafe.push(...(res.body as PaginatedCafesDto).items);
    }
    expect(openBody.total).toBe(
      everyCafe.filter((c) => isOpenAt(c.openingHours ?? [], now)).length,
    );

    const anyTime = await get('/api/cafes?openNow=false&limit=1').expect(200);
    expect((anyTime.body as PaginatedCafesDto).total).toBe(seeded);
    await get('/api/cafes?openNow=maybe').expect(400);
  });

  it('lang=th returns Thai text where translated, English otherwise', async () => {
    const list = await get('/api/cafes?sort=rating&limit=2').expect(200);
    const [translated, untranslated] = (list.body as PaginatedCafesDto).items;
    const th = {
      specialty: 'มัทฉะสไตล์ญี่ปุ่น',
      flavor: 'รสชาเขียวเข้ม',
      atmosphere: 'เงียบ มีสวน',
      aiSummary: { pros: ['มัทฉะอร่อย'], cons: [] },
      model: 'test',
      generatedAt: new Date(),
    };
    const db = await mongoose
      .createConnection(process.env.MONGODB_URI!)
      .asPromise();
    await db
      .collection('cafes')
      .updateOne({ slug: translated.slug }, { $set: { th } });
    await db.close();

    const thai = await get(`/api/cafes/${translated.slug}?lang=th`).expect(200);
    const thaiCafe = thai.body as CafeResponseDto;
    expect(thaiCafe).toMatchObject({
      specialty: th.specialty,
      flavor: th.flavor,
      atmosphere: th.atmosphere,
      aiSummary: th.aiSummary,
      textLang: 'th',
      // Never translated: names and filter values stay as stored.
      name: translated.name,
      area: translated.area,
      tags: translated.tags,
    });
    expect(thaiCafe).not.toHaveProperty('th');

    const english = await get(`/api/cafes/${translated.slug}`).expect(200);
    expect(english.body).toMatchObject({
      specialty: translated.specialty,
      textLang: 'en',
    });

    // Lists and top honour lang too; a café without Thai falls back to English.
    const thaiList = await get('/api/cafes?sort=rating&limit=2&lang=th').expect(
      200,
    );
    const [first, second] = (thaiList.body as PaginatedCafesDto).items;
    expect(first).toMatchObject({ specialty: th.specialty, textLang: 'th' });
    expect(second).toMatchObject({
      slug: untranslated.slug,
      specialty: untranslated.specialty,
      textLang: 'en',
    });
    const top = await get('/api/cafes/top?limit=50&lang=th').expect(200);
    expect(
      (top.body as CafeResponseDto[]).find((c) => c.slug === translated.slug),
    ).toMatchObject({ specialty: th.specialty });

    await get('/api/cafes?lang=fr').expect(400);
    await get(`/api/cafes/${translated.slug}?lang=fr`).expect(400);
    await get(`/api/cafes/${translated.slug}?lang=`).expect(200);
  });

  it('rejects distance options without coordinates and bad input', async () => {
    await get('/api/cafes?radiusKm=3').expect(400);
    await get('/api/cafes?sort=distance').expect(400);
    await get('/api/cafes?lat=18.7').expect(400);
    await get('/api/cafes?limit=500').expect(400);
    await get('/api/cafes?minPrice=200&maxPrice=100').expect(400);
    await get('/api/cafes?drinkType=Beer').expect(400);
    await get('/api/cafes?unknown=1').expect(400);
  });

  it('treats empty query params as not set', async () => {
    const all = await get('/api/cafes?limit=1').expect(200);
    const total = (all.body as PaginatedCafesDto).total;

    const emptyCoords = await get('/api/cafes?lat=&lng=&limit=1').expect(200);
    const coordsBody = emptyCoords.body as PaginatedCafesDto;
    expect(coordsBody.total).toBe(total);
    expect(coordsBody.items[0]).not.toHaveProperty('distanceKm');

    const emptyFilters = await get(
      '/api/cafes?maxPrice=&minPrice=&drinkType=&parking=&tag=&area=&sort=&limit=1',
    ).expect(200);
    expect((emptyFilters.body as PaginatedCafesDto).total).toBe(total);

    await get('/api/cafes?page=').expect(400);

    const top = await get('/api/cafes/top?limit=50').expect(200);
    const emptyTag = await get('/api/cafes/top?tag=&limit=50').expect(200);
    expect(emptyTag.body).toEqual(top.body);
  });

  it('GET /api/cafes/top respects tag and minReviews', async () => {
    const res = await get('/api/cafes/top?tag=Matcha&limit=10').expect(200);
    const cafes = res.body as CafeResponseDto[];
    expect(cafes.length).toBeGreaterThan(0);
    for (const cafe of cafes) {
      expect(cafe.tags).toContain('Matcha');
      expect(cafe.reviewCount).toBeGreaterThanOrEqual(50);
    }
  });

  it('GET /api/cafes/filters returns facet values', async () => {
    const res = await get('/api/cafes/filters').expect(200);
    expect(res.body).toMatchObject({
      drinkTypes: ['Coffee', 'Tea', 'Non-Coffee'],
      areas: expect.arrayContaining(['Old City', 'Nimman']) as string[],
    });
  });

  it('GET /api/cafes/:slug returns one café or 404', async () => {
    const res = await get('/api/cafes/twenty-mar').expect(200);
    const cafe = res.body as CafeResponseDto;
    expect(cafe.name).toBe('TWENTY MAR');
    expect(cafe.lat).toBeCloseTo(18.789, 2);
    await get('/api/cafes/does-not-exist').expect(404);
  });

  describe('name search (q)', () => {
    const names = async (path: string) =>
      ((await get(path).expect(200)).body as PaginatedCafesDto).items.map(
        (c) => c.name,
      );

    it('finds a café by any part of its name, ignoring case and punctuation', async () => {
      for (const q of [
        'arabica',
        '%ARABICA',
        '  Arabica   one  ',
        'nimman arabica',
      ]) {
        expect(await names(`/api/cafes?q=${encodeURIComponent(q)}`)).toContain(
          '% Arabica Chiang Mai One Nimman',
        );
      }
    });

    it('needs every word, and finds nothing for a café we do not have', async () => {
      expect(await names('/api/cafes?q=arabica%20starbucks')).toEqual([]);
      expect(await names('/api/cafes?q=starbucks')).toEqual([]);
    });

    it('combines with filters and with the distance search', async () => {
      const coffee = await names(
        '/api/cafes?q=coffee&drinkType=Coffee&limit=50',
      );
      expect(coffee.length).toBeGreaterThan(0);
      for (const name of coffee) expect(name.toLowerCase()).toContain('coffee');

      const near = (
        await get(
          `/api/cafes?q=arabica&lat=${ORIGIN.lat}&lng=${ORIGIN.lng}`,
        ).expect(200)
      ).body as PaginatedCafesDto;
      expect(near.items[0].name).toBe('% Arabica Chiang Mai One Nimman');
      expect(near.items[0].distanceKm).toBeGreaterThan(0);
    });

    it('treats the text as plain text, not a regex, and limits its length', async () => {
      await get('/api/cafes?q=(').expect(200);
      expect(await names('/api/cafes?q=a.*z')).toEqual(
        await names('/api/cafes?q=a%20z'),
      );
      await get(`/api/cafes?q=${'a'.repeat(61)}`).expect(400);
      await get('/api/cafes?q[$ne]=x').expect(400);
    });
  });
});
