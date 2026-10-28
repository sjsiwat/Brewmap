"use client";

import { formatKm, haversineKm } from "@/lib/geo";
import { format } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/client";
import { useUserLocation } from "@/lib/use-user-location";

export function DistanceFromOrigin({ lat, lng }: { lat: number; lng: number }) {
  const { origin, status } = useUserLocation();
  const { t } = useI18n();
  const km = formatKm(haversineKm(origin, { lat, lng }), t.units.km);

  return (
    <span>
      {status === "device"
        ? format(t.detail.fromYou, { km })
        : format(t.detail.fromPlace, { km, place: t.places.thaPhaeGate })}
    </span>
  );
}
