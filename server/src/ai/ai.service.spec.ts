import { nextRelaxation, sanitizeFilters } from './ai.service';

const context = {
  tags: ['Matcha', 'Quiet', 'Specialty'],
  areas: ['Nimman', 'Old City'],
  hasOrigin: false,
};

describe('sanitizeFilters', () => {
  it('keeps valid filters', () => {
    expect(
      sanitizeFilters(
        {
          minPrice: 50,
          maxPrice: 150,
          drinkType: 'Tea',
          parking: true,
          petFriendly: true,
          tag: 'Matcha',
          area: 'Nimman',
          sort: 'price',
        },
        context,
      ),
    ).toEqual({
      minPrice: 50,
      maxPrice: 150,
      drinkType: 'Tea',
      parking: true,
      petFriendly: true,
      tag: 'Matcha',
      area: 'Nimman',
      sort: 'price',
    });
  });

  it('drops empty strings and false booleans instead of keeping them as filters', () => {
    const out = sanitizeFilters(
      { tag: '', area: '', drinkType: '', parking: false, petFriendly: false },
      context,
    );
    expect(out).toEqual({});
    expect(Object.keys(out)).toEqual([]);
  });

  it('drops invalid values one by one, keeping the rest', () => {
    expect(
      sanitizeFilters(
        {
          maxPrice: -5,
          drinkType: 'Beer',
          parking: 'maybe',
          tag: 'Matcha',
          sort: 'random',
        },
        context,
      ),
    ).toEqual({ tag: 'Matcha' });
  });

  it('drops tags and areas the database does not have', () => {
    expect(
      sanitizeFilters({ tag: 'Rooftop', area: 'Bangkok' }, context),
    ).toEqual({});
  });

  it('drops unknown keys and non-scalar values (no operator injection)', () => {
    expect(
      sanitizeFilters(
        {
          area: { $ne: null },
          tag: ['Matcha'],
          lat: 1,
          limit: 50,
          $where: 'sleep(1000)',
          drinkType: 'Coffee',
        },
        context,
      ),
    ).toEqual({ drinkType: 'Coffee' });
  });

  it('drops distance-only filters without a location, keeps them with one', () => {
    const proposed = { radiusKm: 3, sort: 'distance' };
    expect(sanitizeFilters(proposed, context)).toEqual({});
    expect(sanitizeFilters(proposed, { ...context, hasOrigin: true })).toEqual(
      proposed,
    );
  });

  it('drops an impossible price range instead of failing', () => {
    expect(sanitizeFilters({ minPrice: 200, maxPrice: 100 }, context)).toEqual(
      {},
    );
  });

  it('returns no filters for output that is not an object', () => {
    for (const output of [null, 'Matcha', 42, ['Matcha'], undefined]) {
      expect(sanitizeFilters(output, context)).toEqual({});
    }
  });
});

describe('nextRelaxation', () => {
  it('gives up tag, area and drink before price, pets and parking', () => {
    expect(
      nextRelaxation({
        parking: true,
        maxPrice: 80,
        tag: 'Quiet',
        area: 'Nimman',
      }),
    ).toEqual({ key: 'tag' });
    expect(
      nextRelaxation({ parking: true, maxPrice: 80, area: 'Nimman' }),
    ).toEqual({ key: 'area' });
    expect(nextRelaxation({ parking: true, petFriendly: true })).toEqual({
      key: 'petFriendly',
    });
  });

  it('never drops the sort order, and stops when nothing is left', () => {
    expect(nextRelaxation({ sort: 'reviews' })).toBeNull();
    expect(nextRelaxation({})).toBeNull();
  });
});
