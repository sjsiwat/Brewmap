import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { CafeResponseDto } from '../src/cafes/dto/cafe-response.dto';
import {
  MyReviewDto,
  PaginatedReviewsDto,
  ReviewResponseDto,
} from '../src/reviews/dto/review.dto';
import { seedCafes } from '../scripts/seed';

type Agent = ReturnType<typeof request.agent>;

const PASSWORD = 'correct-horse';
const TEXT = 'Creamy latte, quiet corner, friendly staff.';

describe('Reviews API (e2e)', () => {
  let mongo: MongoMemoryServer;
  let app: INestApplication<App>;
  let slug: string;
  let otherSlug: string;
  let alice: Agent;
  let bob: Agent;
  let carol: Agent;

  async function signedIn(name: string): Promise<Agent> {
    const email = `${name}@example.com`;
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, password: PASSWORD, displayName: name })
      .expect(201);
    const agent = request.agent(app.getHttpServer());
    await agent
      .post('/api/auth/login')
      .send({ email, password: PASSWORD })
      .expect(200);
    return agent;
  }

  const http = () => request(app.getHttpServer());
  const reviewsOf = async (s: string) =>
    (await http().get(`/api/cafes/${s}/reviews`).expect(200))
      .body as PaginatedReviewsDto;
  const cafe = async (s: string) =>
    (await http().get(`/api/cafes/${s}`).expect(200)).body as CafeResponseDto;

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

    const res = await http().get('/api/cafes?limit=2').expect(200);
    [slug, otherSlug] = (res.body as { items: CafeResponseDto[] }).items.map(
      (c) => c.slug,
    );
    alice = await signedIn('alice');
    bob = await signedIn('bob');
    carol = await signedIn('carol');
  }, 120_000);

  afterAll(async () => {
    await app?.close();
    await mongo?.stop();
  });

  it('a café without reviews has empty totals', async () => {
    const list = await reviewsOf(slug);
    expect(list).toMatchObject({
      items: [],
      total: 0,
      communityRating: null,
      communityReviewCount: 0,
    });
    expect(await cafe(slug)).toMatchObject({
      communityRating: null,
      communityReviewCount: 0,
    });
    await http().get('/api/cafes/no-such-cafe/reviews').expect(404);
  });

  it('writing needs login and a valid body', async () => {
    const valid = { rating: 5, text: TEXT };
    await http().post(`/api/cafes/${slug}/reviews`).send(valid).expect(401);

    const bad = [
      { ...valid, rating: 0 },
      { ...valid, rating: 6 },
      { ...valid, rating: 4.5 },
      { ...valid, text: '   too short  ' },
      { ...valid, text: 'x'.repeat(1001) },
      { ...valid, drinkOrdered: 'x'.repeat(101) },
      { ...valid, userId: '000000000000000000000000' },
    ];
    for (const body of bad) {
      await alice.post(`/api/cafes/${slug}/reviews`).send(body).expect(400);
    }
    await alice.post('/api/cafes/no-such-cafe/reviews').send(valid).expect(404);
  });

  let aliceReview: ReviewResponseDto;

  it('creates a review and updates the community rating', async () => {
    const res = await alice
      .post(`/api/cafes/${slug}/reviews`)
      .send({ rating: 5, text: `  ${TEXT}  `, drinkOrdered: 'Iced latte' })
      .expect(201);
    aliceReview = res.body as ReviewResponseDto;
    expect(aliceReview).toMatchObject({
      rating: 5,
      text: TEXT,
      drinkOrdered: 'Iced latte',
      author: { displayName: 'alice' },
    });
    expect(aliceReview).not.toHaveProperty('userId');

    expect(await cafe(slug)).toMatchObject({
      communityRating: 5,
      communityReviewCount: 1,
    });
    // Google's rating is untouched.
    expect((await cafe(slug)).rating).not.toBeNull();
  });

  it('one review per user per café -> 409', async () => {
    await alice
      .post(`/api/cafes/${slug}/reviews`)
      .send({ rating: 1, text: TEXT })
      .expect(409);
    // A different café is fine.
    await alice
      .post(`/api/cafes/${otherSlug}/reviews`)
      .send({ rating: 3, text: TEXT })
      .expect(201);
  });

  it('averages every review, rounded to one decimal, newest first', async () => {
    await bob
      .post(`/api/cafes/${slug}/reviews`)
      .send({ rating: 2, text: TEXT })
      .expect(201);
    await carol
      .post(`/api/cafes/${slug}/reviews`)
      .send({ rating: 4, text: TEXT })
      .expect(201);

    const list = await reviewsOf(slug);
    // (5 + 2 + 4) / 3 = 3.67
    expect(list).toMatchObject({
      total: 3,
      communityRating: 3.7,
      communityReviewCount: 3,
    });
    expect(list.items.map((r) => r.author.displayName)).toEqual([
      'carol',
      'bob',
      'alice',
    ]);
    expect(await cafe(slug)).toMatchObject({
      communityRating: 3.7,
      communityReviewCount: 3,
    });

    const page2 = (
      await http().get(`/api/cafes/${slug}/reviews?limit=2&page=2`).expect(200)
    ).body as PaginatedReviewsDto;
    expect(page2.items.map((r) => r.author.displayName)).toEqual(['alice']);
  });

  it('GET mine returns your own review or null', async () => {
    const mine = (
      await alice.get(`/api/cafes/${slug}/reviews/mine`).expect(200)
    ).body as MyReviewDto;
    expect(mine.review?.id).toBe(aliceReview.id);

    const none = (
      await alice.get(`/api/cafes/${otherSlug}/reviews/mine`).expect(200)
    ).body as MyReviewDto;
    expect(none.review?.rating).toBe(3);

    const noReview = await signedIn('dave');
    const empty = (
      await noReview.get(`/api/cafes/${slug}/reviews/mine`).expect(200)
    ).body as MyReviewDto;
    expect(empty).toEqual({ review: null });

    await http().get(`/api/cafes/${slug}/reviews/mine`).expect(401);
  });

  it("someone else's review -> 403, and it stays unchanged", async () => {
    await bob
      .patch(`/api/reviews/${aliceReview.id}`)
      .send({ rating: 1 })
      .expect(403);
    await bob.delete(`/api/reviews/${aliceReview.id}`).expect(403);
    await http()
      .patch(`/api/reviews/${aliceReview.id}`)
      .send({ rating: 1 })
      .expect(401);

    const list = await reviewsOf(slug);
    expect(list.items.find((r) => r.id === aliceReview.id)?.rating).toBe(5);
    expect(list.communityReviewCount).toBe(3);
  });

  it('the author can edit; totals are recomputed', async () => {
    const res = await alice
      .patch(`/api/reviews/${aliceReview.id}`)
      .send({ rating: 3, drinkOrdered: '' })
      .expect(200);
    const edited = res.body as ReviewResponseDto;
    expect(edited).toMatchObject({ rating: 3, text: TEXT });
    expect(edited).not.toHaveProperty('drinkOrdered');

    // (3 + 2 + 4) / 3 = 3
    expect(await cafe(slug)).toMatchObject({
      communityRating: 3,
      communityReviewCount: 3,
    });

    await alice
      .patch(`/api/reviews/${aliceReview.id}`)
      .send({ text: 'short' })
      .expect(400);
    for (const body of [{ rating: null }, { text: null }]) {
      await alice
        .patch(`/api/reviews/${aliceReview.id}`)
        .send(body)
        .expect(400);
    }
    await alice
      .patch('/api/reviews/000000000000000000000000')
      .send({ rating: 2 })
      .expect(404);
    await alice.patch('/api/reviews/not-an-id').send({ rating: 2 }).expect(404);
  });

  it('the author can delete; totals drop back to null at zero', async () => {
    await alice.delete(`/api/reviews/${aliceReview.id}`).expect(204);
    await alice.delete(`/api/reviews/${aliceReview.id}`).expect(404);
    // (2 + 4) / 2 = 3
    expect(await cafe(slug)).toMatchObject({
      communityRating: 3,
      communityReviewCount: 2,
    });

    for (const agent of [bob, carol]) {
      const { review } = (
        await agent.get(`/api/cafes/${slug}/reviews/mine`).expect(200)
      ).body as MyReviewDto;
      await agent.delete(`/api/reviews/${review!.id}`).expect(204);
    }
    expect(await cafe(slug)).toMatchObject({
      communityRating: null,
      communityReviewCount: 0,
    });

    // Deleting lets you write a new one.
    await alice
      .post(`/api/cafes/${slug}/reviews`)
      .send({ rating: 4, text: TEXT })
      .expect(201);
  });

  it('re-seeding keeps the community rating', async () => {
    const before = await cafe(slug);
    expect(before.communityReviewCount).toBe(1);

    await seedCafes(process.env.MONGODB_URI!);

    expect(await cafe(slug)).toMatchObject({
      communityRating: before.communityRating,
      communityReviewCount: 1,
    });
  });
});
