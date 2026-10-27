export interface LatLng {
  lat: number;
  lng: number;
}

/** Fallback origin when the user hasn't shared their location: Tha Phae Gate, Old City. */
export const DEFAULT_ORIGIN: LatLng = { lat: 18.7876, lng: 98.9933 };
export const DEFAULT_ORIGIN_LABEL = "Tha Phae Gate";

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

export function formatKm(km: number): string {
  return `${km.toFixed(1)} km`;
}
