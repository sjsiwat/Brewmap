export interface LatLng {
  lat: number;
  lng: number;
}

/** Fallback origin when the user hasn't shared their location: Tha Phae Gate, Old City. */
export const DEFAULT_ORIGIN: LatLng = { lat: 18.7876, lng: 98.9933 };

export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** 1.23 → "1.2 km"; `unit` is the dictionary's units.km, e.g. "{n} กม.". */
export function formatKm(km: number, unit = "{n} km"): string {
  return unit.replace("{n}", km.toFixed(1));
}
