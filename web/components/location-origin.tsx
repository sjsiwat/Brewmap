"use client";

import { DEFAULT_ORIGIN_LABEL, formatKm, haversineKm } from "@/lib/geo";
import { useUserLocation } from "@/lib/use-user-location";

export function DistanceFromOrigin({ lat, lng }: { lat: number; lng: number }) {
  const { origin, status } = useUserLocation();
  const km = haversineKm(origin, { lat, lng });
  const from = status === "device" ? "from you" : `from ${DEFAULT_ORIGIN_LABEL}`;

  return (
    <span>
      {formatKm(km)} {from}
    </span>
  );
}
