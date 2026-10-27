"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Cafe } from "@/lib/cafes";

interface FavoritesContextValue {
  /** Newest first. Empty while logged out. */
  cafes: Cafe[];
  status: "idle" | "loading" | "ready" | "error";
  isFavorite: (slug: string) => boolean;
  /** Optimistic: flips immediately and rolls back if the API call fails. */
  toggle: (cafe: Cafe) => Promise<void>;
  reload: () => void;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

// Stable reference so the context value doesn't change on every render while logged out.
const NO_CAFES: Cafe[] = [];

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [state, setState] = useState<{
    userId: string | null;
    cafes: Cafe[];
    status: FavoritesContextValue["status"];
  }>({ userId: null, cafes: [], status: "idle" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    api
      .getFavorites()
      .then((cafes) => {
        if (!cancelled) setState({ userId, cafes, status: "ready" });
      })
      .catch(() => {
        if (!cancelled) setState({ userId, cafes: [], status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [userId, attempt]);

  // Results for another user (or from before logout) are never shown.
  const current =
    userId && state.userId === userId
      ? state
      : { cafes: NO_CAFES, status: userId ? ("loading" as const) : ("idle" as const) };

  const toggle = useCallback(
    async (cafe: Cafe) => {
      if (!userId) return;
      const wasFavorite = current.cafes.some((c) => c.slug === cafe.slug);
      const update = (fn: (cafes: Cafe[]) => Cafe[]) =>
        setState((prev) => (prev.userId === userId ? { ...prev, cafes: fn(prev.cafes) } : prev));

      update((cafes) =>
        wasFavorite ? cafes.filter((c) => c.slug !== cafe.slug) : [cafe, ...cafes],
      );
      try {
        await (wasFavorite ? api.removeFavorite(cafe.slug) : api.addFavorite(cafe.slug));
      } catch (error) {
        update((cafes) =>
          wasFavorite ? [cafe, ...cafes] : cafes.filter((c) => c.slug !== cafe.slug),
        );
        throw error;
      }
    },
    [userId, current.cafes],
  );

  const value = useMemo<FavoritesContextValue>(
    () => ({
      cafes: current.cafes,
      status: current.status,
      isFavorite: (slug) => current.cafes.some((c) => c.slug === slug),
      toggle,
      reload: () => setAttempt((n) => n + 1),
    }),
    [current.cafes, current.status, toggle],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesContextValue {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error("useFavorites must be used inside <FavoritesProvider>");
  return context;
}
