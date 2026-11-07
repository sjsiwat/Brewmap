import { nextRelaxation } from './ai.service';
import { applyRequestRules, areasMentioned } from './request-rules';

const context = {
  tags: ['Matcha', 'Thai tea', 'Work-friendly', 'Garden', 'Quiet'],
  areas: ['Nimman', 'Old City', 'Mae Hia', 'Suthep'],
  hasOrigin: true,
};

describe('applyRequestRules', () => {
  it('adds parking Gemini dropped, and drops an area and radius nobody asked for', () => {
    // What flash-lite actually returned for this request (2026-11-07).
    const out = applyRequestRules(
      'ร้านเงียบ ๆ นั่งทำงานได้ มีที่จอดรถ',
      { tag: 'Work-friendly', area: 'Old City', radiusKm: 5, sort: 'distance' },
      context,
    );
    expect(out.filters).toEqual({
      tag: 'Work-friendly',
      parking: true,
      sort: 'distance',
    });
    expect(out.pinned).toEqual([]);
  });

  it('turns matcha into the Matcha tag, never a drink type', () => {
    const out = applyRequestRules(
      'มัทฉะไม่เกิน 150 บาท ใกล้นิมมาน',
      { drinkType: 'Non-Coffee', maxPrice: 150, radiusKm: 2 },
      context,
    );
    expect(out.filters).toEqual({
      tag: 'Matcha',
      maxPrice: 150,
      area: 'Nimman',
    });
    // Gemini dropped the price too: the words still set it.
    expect(
      applyRequestRules('มัทฉะไม่เกิน 150 บาท ใกล้นิมมาน', {}, context).filters,
    ).toEqual({ tag: 'Matcha', maxPrice: 150, area: 'Nimman' });
    expect(out.pinned).toEqual(['tag', 'area']);
  });

  it('reads a top price Gemini dropped, but not a distance or a time', () => {
    const rules = (q: string, f = {}) =>
      applyRequestRules(q, f, { ...context, hasOrigin: false }).filters;
    expect(rules('มัทฉะไม่เกิน 150 บาท').maxPrice).toBe(150);
    expect(rules('coffee under 80 baht', { maxPrice: 100 }).maxPrice).toBe(80);
    expect(rules('budget ฿120').maxPrice).toBe(120);
    expect(rules('ไม่เกิน 500 เมตร')).toEqual({});
    expect(rules('under 10 minutes walk')).toEqual({});
    expect(rules('ไม่เกิน 100 บาท', { minPrice: 200 })).toEqual({
      maxPrice: 100,
    });
  });

  it('reads pets and parking in English too', () => {
    const out = applyRequestRules(
      'somewhere I can bring my dog, coming by car',
      {},
      { ...context, hasOrigin: false },
    );
    expect(out.filters).toEqual({ parking: true, petFriendly: true });
  });

  it('does not read a cat café as bringing a pet', () => {
    expect(applyRequestRules('คาเฟ่แมว', {}, context).filters).toEqual({});
    expect(
      applyRequestRules('พาแมวไปได้', {}, context).filters.petFriendly,
    ).toBe(true);
  });

  it('keeps a radius for "near me" or a distance, not for a named area', () => {
    expect(
      applyRequestRules('quiet cafe near me', { radiusKm: 2 }, context).filters,
    ).toEqual({ radiusKm: 2 });
    expect(
      applyRequestRules('แถวนิมมาน', { area: 'Nimman', radiusKm: 5 }, context)
        .filters,
    ).toEqual({ area: 'Nimman' });
    expect(
      applyRequestRules(
        'นิมมาน ไม่เกิน 2 กม.',
        { area: 'Nimman', radiusKm: 2 },
        context,
      ).filters,
    ).toEqual({ area: 'Nimman', radiusKm: 2 });
    expect(
      applyRequestRules(
        'near me',
        { radiusKm: 2 },
        { ...context, hasOrigin: false },
      ).filters,
    ).toEqual({});
  });

  it('uses the area the request names over the one Gemini picked', () => {
    expect(
      applyRequestRules('ร้านแถวแม่เหียะ', { area: 'Old City' }, context)
        .filters,
    ).toEqual({ area: 'Mae Hia' });
  });

  it('skips a tag the database does not have', () => {
    const out = applyRequestRules(
      'matcha',
      { drinkType: 'Tea' },
      { ...context, tags: [] },
    );
    expect(out.filters).toEqual({ drinkType: 'Tea' });
  });
});

describe('areasMentioned', () => {
  it('matches English, Thai and landmark names', () => {
    expect(areasMentioned('near Maya mall', context.areas)).toEqual(['Nimman']);
    expect(areasMentioned('ใกล้ประตูท่าแพ', context.areas)).toEqual([
      'Old City',
    ]);
    expect(areasMentioned('close to CMU', context.areas)).toEqual(['Suthep']);
    expect(areasMentioned('somewhere quiet', context.areas)).toEqual([]);
    expect(areasMentioned('acmusic cafe', context.areas)).toEqual([]);
  });
});

describe('nextRelaxation with pinned filters', () => {
  it('gives up the others before what the request named', () => {
    const filters = { tag: 'Matcha', area: 'Nimman', maxPrice: 150 };
    expect(nextRelaxation(filters, ['tag', 'area'])).toEqual({
      key: 'maxPrice',
    });
    expect(
      nextRelaxation({ tag: 'Matcha', area: 'Nimman' }, ['tag', 'area']),
    ).toEqual({ key: 'tag' });
    expect(nextRelaxation({ q: 'Ristr8to', tag: 'Matcha' }, ['tag'])).toEqual({
      key: 'tag',
    });
  });
});
