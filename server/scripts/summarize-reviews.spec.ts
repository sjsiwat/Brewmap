import { cleanItems } from './summarize-reviews';

describe('cleanItems', () => {
  it('keeps short, trimmed, unique strings, at most 4', () => {
    expect(
      cleanItems([
        '  Creamy   latte ',
        'Creamy latte',
        42,
        '',
        'x'.repeat(91),
        'Quiet',
        'Parking',
        'Friendly staff',
        'Fifth item',
      ]),
    ).toEqual(['Creamy latte', 'Quiet', 'Parking', 'Friendly staff']);
  });

  it('returns [] for anything that is not an array', () => {
    for (const value of [null, undefined, 'Creamy latte', { 0: 'x' }]) {
      expect(cleanItems(value)).toEqual([]);
    }
  });
});
