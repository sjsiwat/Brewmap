import { cleanEnrichment, reviewLines } from './enrich-cafes';

const reply = {
  specialty: 'Coconut cold brew',
  flavor: 'Bright, fruity',
  atmosphere: 'Garden, quiet mornings',
  priceAvg: 89.6,
  priceFromReviews: true,
  tags: ['Garden', 'Cold brew', 'Garden', 'Not a tag'],
  petFriendly: false,
  parking: true,
  drinkType: 'Coffee',
};

describe('cleanEnrichment', () => {
  it('keeps the fields, trimmed, with known tags only and a whole price', () => {
    expect(
      cleanEnrichment({ ...reply, specialty: '  Coconut   cold brew ' }),
    ).toEqual({
      specialty: 'Coconut cold brew',
      flavor: 'Bright, fruity',
      atmosphere: 'Garden, quiet mornings',
      priceAvg: 90,
      priceFromReviews: true,
      tags: ['Garden', 'Cold brew'],
      petFriendly: false,
      parking: true,
      drinkType: 'Coffee',
    });
  });

  it('treats a missing priceFromReviews as an estimate', () => {
    expect(
      cleanEnrichment({ ...reply, priceFromReviews: undefined })
        ?.priceFromReviews,
    ).toBe(false);
  });

  it.each([
    ['a missing field', { ...reply, flavor: undefined }],
    ['text in Thai', { ...reply, specialty: 'กาแฟเย็น' }],
    ['a placeholder (not a café)', { ...reply, flavor: 'N/A' }],
    ['text too long', { ...reply, atmosphere: 'x'.repeat(61) }],
    ['a price out of range', { ...reply, priceAvg: 5000 }],
    ['no usable tag', { ...reply, tags: ['Not a tag'] }],
    ['a non-boolean flag', { ...reply, parking: 'yes' }],
    ['an unknown drink type', { ...reply, drinkType: 'Beer' }],
    ['not an object', 'Coconut cold brew'],
  ])('rejects %s', (_, output) => {
    expect(cleanEnrichment(output)).toBeNull();
  });
});

describe('reviewLines', () => {
  it('prefers the English translation and skips reviews without text', () => {
    expect(
      reviewLines({
        title: 'X',
        user_reviews: [
          { Rating: 5, text_original: 'อร่อย', text_translated: 'Tasty' },
          { Rating: '4', Description: '  Nice   view ' },
          { Rating: 3 },
        ],
      }),
    ).toEqual(['5★ Tasty', '4★ Nice view']);
  });
});
