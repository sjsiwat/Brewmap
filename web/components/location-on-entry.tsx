"use client";

import { useAskLocationOnEntry } from "@/lib/use-user-location";

/** Mounted once in the root layout: asks for location when the visitor arrives. */
export function LocationOnEntry() {
  useAskLocationOnEntry();
  return null;
}
