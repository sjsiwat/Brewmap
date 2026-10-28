"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import * as api from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n/client";
import type { Cafe } from "@/lib/cafes";

interface FavoritesContextValue {
  /** Newest first. Empty while logged out. */
  cafes: Cafe[];
  status: "idle" | "loading" | "ready" | "error";
  isFavorite: (slug: string) => boolean;
  /**
   * Optimistic: flips immediately and rolls back if the API call fails. Clicks on a
   * café whose previous toggle is still in flight are ignored, so requests can't
   * overtake each other and leave the UI and the server disagreeing.
   */
  toggle: (cafe: Cafe) => Promise<void>;
  reload: () => void;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

// Stable reference so the context value doesn't change on every render while logged out.
const NO_CAFES: Cafe[] = [];

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user, endSession } = useAuth();
  const { lang } = useI18n();
  const userId = user?.id ?? null;
  const [state, setState] = useState<{
    userId: string | null;
    cafes: Cafe[];
    status: FavoritesContextValue["status"];
  }>({ userId: null, cafes: [], status: "idle" });
  const [attempt, setAttempt] = useState(0);
  const pending = useRef(new Set<string>());

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    api
      .getFavorites(lang)
      .then((cafes) => {
        if (!cancelled) setState({ userId, cafes, status: "ready" });
      })
      .catch(() => {
        if (!cancelled) setState({ userId, cafes: [], status: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [userId, attempt, lang]);

  // Results for another user (or from before logout) are never shown.
  const current =
    userId && state.userId === userId
      ? state
      : { cafes: NO_CAFES, status: userId ? ("loading" as const) : ("idle" as const) };

  const toggle = useCallback(
    async (cafe: Cafe) => {
      if (!userId || pending.current.has(cafe.slug)) return;
      pending.current.add(cafe.slug);

      const wasFavorite = current.cafes.some((c) => c.slug === cafe.slug);
      const without = (cafes: Cafe[]) => cafes.filter((c) => c.slug !== cafe.slug);
      const update = (fn: (cafes: Cafe[]) => Cafe[]) =>
        setState((prev) => (prev.userId === userId ? { ...prev, cafes: fn(prev.cafes) } : prev));

      update((cafes) => (wasFavorite ? without(cafes) : [cafe, ...without(cafes)]));
      try {
        await (wasFavorite ? api.removeFavorite(cafe.slug) : api.addFavorite(cafe.slug));
      } catch (error) {
        update((cafes) => (wasFavorite ? [cafe, ...without(cafes)] : without(cafes)));
        // Session expired or was ended elsewhere: show the visitor as logged out.
        if (error instanceof api.ApiError && error.status === 401) endSession();
        throw error;
      } finally {
        pending.current.delete(cafe.slug);
      }
    },
    [userId, current.cafes, endSession],
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
