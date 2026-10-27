"use client";

import { useEffect, useSyncExternalStore } from "react";
import { DEFAULT_ORIGIN, type LatLng } from "@/lib/geo";

export type LocationStatus = "default" | "locating" | "device" | "denied" | "unsupported";

interface LocationState {
  origin: LatLng;
  status: LocationStatus;
}

// Module-level store so every component (finder list, detail page) shares one
// origin and the browser permission prompt is only triggered once.
let state: LocationState = { origin: DEFAULT_ORIGIN, status: "default" };
const listeners = new Set<() => void>();
let checkedPermission = false;

function setState(next: LocationState) {
  state = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getSnapshot = () => state;
const getServerSnapshot = (): LocationState => ({ origin: DEFAULT_ORIGIN, status: "default" });

export function requestUserLocation() {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    setState({ origin: DEFAULT_ORIGIN, status: "unsupported" });
    return;
  }
  setState({ ...state, status: "locating" });
  navigator.geolocation.getCurrentPosition(
    (position) =>
      setState({
        origin: { lat: position.coords.latitude, lng: position.coords.longitude },
        status: "device",
      }),
    () => setState({ origin: DEFAULT_ORIGIN, status: "denied" }),
    { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60_000 },
  );
}

export function useUserLocation(): LocationState {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // If the user already granted permission earlier, use it silently - never
  // prompt on page load; prompting only happens via requestUserLocation().
  useEffect(() => {
    if (checkedPermission || !navigator.permissions) return;
    checkedPermission = true;
    navigator.permissions
      .query({ name: "geolocation" })
      .then((result) => {
        if (result.state === "granted") requestUserLocation();
      })
      .catch(() => {});
  }, []);

  return snapshot;
}
