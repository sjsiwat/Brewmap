import { Cafe } from '../schemas/cafe.schema';
import { toCafeResponse } from './cafe-response.dto';

const cafe: Cafe = {
  slug: 'twenty-mar',
  index: '002',
  name: 'TWENTY MAR',
  area: 'Old City',
  address: 'Three Kings Monument',
  specialty: 'Hojicha latte',
  flavor: 'Mild',
  atmosphere: 'Stylish',
  priceAvg: 110,
  tags: ['Specialty'],
  hours: '08:00–18:00',
  rating: 4.9,
  reviewCount: 2379,
  petFriendly: false,
  parking: false,
  drinkType: 'Coffee',
  location: { type: 'Point', coordinates: [98.9879, 18.7892] },
  communityRating: null,
  communityReviewCount: 0,
};

describe('toCafeResponse', () => {
  it('flattens GeoJSON [lng, lat] into lat/lng and hides location', () => {
    const res = toCafeResponse(cafe);
    expect(res.lat).toBe(18.7892);
    expect(res.lng).toBe(98.9879);
    expect(res).not.toHaveProperty('location');
    expect(res).not.toHaveProperty('distanceKm');
  });

  it('converts distance meters to km with one decimal', () => {
    expect(toCafeResponse({ ...cafe, distanceMeters: 1234 }).distanceKm).toBe(
      1.2,
    );
    expect(toCafeResponse({ ...cafe, distanceMeters: 0 }).distanceKm).toBe(0);
  });

  it('defaults community fields for cafés stored before reviews existed', () => {
    const legacy: Partial<Cafe> = { ...cafe };
    delete legacy.communityRating;
    delete legacy.communityReviewCount;
    const res = toCafeResponse(legacy as Cafe);
    expect(res.communityRating).toBeNull();
    expect(res.communityReviewCount).toBe(0);
  });
});
