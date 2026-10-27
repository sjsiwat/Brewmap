import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import {
  CafeResponseDto,
  PaginatedCafesDto,
} from '../src/cafes/dto/cafe-response.dto';
import { seedCafes } from '../scripts/seed';

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
});
