"use client";

import { LocateFixed } from "lucide-react";
import { DEFAULT_ORIGIN_LABEL, formatKm, haversineKm } from "@/lib/geo";
import {
  requestUserLocation,
  useUserLocation,
  type LocationStatus,
} from "@/lib/use-user-location";

const statusText: Record<LocationStatus, string> = {
  default: `Distances from ${DEFAULT_ORIGIN_LABEL}`,
  locating: "Locating you…",
  device: "Distances from your location",
  denied: `Location blocked · from ${DEFAULT_ORIGIN_LABEL}`,
  unsupported: `Distances from ${DEFAULT_ORIGIN_LABEL}`,
};

export function LocationOrigin() {
  const { status } = useUserLocation();
  const canRequest = status === "default" || status === "denied";

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-xs uppercase tracking-[0.1em] text-muted">
      <span aria-live="polite">{statusText[status]}</span>
      {canRequest && (
        <button
          type="button"
          onClick={requestUserLocation}
          className="inline-flex items-center gap-1.5 uppercase text-rust transition-colors hover:underline focus-ring"
        >
          <LocateFixed size={13} aria-hidden />
          Use my location
        </button>
      )}
    </div>
  );
}

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
