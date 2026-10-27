"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as api from "@/lib/api";
import type { User } from "@/lib/api";

export type AuthStatus = "loading" | "authenticated" | "anonymous";

interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
  login: (email: string, password: string) => Promise<User>;
  /** Creates the account, then logs in with the same credentials. */
  register: (email: string, password: string, displayName: string) => Promise<User>;
  logout: () => Promise<void>;
  /** The API said the session is gone (401): treat the user as logged out locally. */
  endSession: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Session state from `GET /api/auth/me`. The token itself lives in an httpOnly
 * cookie, so this only ever knows *who* is logged in, never the token.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    let cancelled = false;
    api
      .getMe()
      // API down: treat as logged out rather than blocking the page.
      .catch(() => null)
      .then((me) => {
        if (cancelled) return;
        setUser(me);
        setStatus(me ? "authenticated" : "anonymous");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const me = await api.login({ email, password });
    setUser(me);
    setStatus("authenticated");
    return me;
  }, []);

  const register = useCallback(
    async (email: string, password: string, displayName: string) => {
      await api.register({ email, password, displayName });
      return login(email, password);
    },
    [login],
  );

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
    setStatus("anonymous");
  }, []);

  const endSession = useCallback(() => {
    setUser(null);
    setStatus("anonymous");
  }, []);

  const value = useMemo(
    () => ({ user, status, login, register, logout, endSession }),
    [user, status, login, register, logout, endSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}

const NEXT_BASE = "https://brewmap.invalid";

/**
 * Only same-site paths, so `?next=` can't redirect off BrewMap. Parsed as a URL
 * rather than prefix-checked: browsers read `/\evil.example` as `//evil.example`.
 */
export function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith("/")) return "/cafes";
  try {
    const url = new URL(next, NEXT_BASE);
    if (url.origin !== NEXT_BASE) return "/cafes";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/cafes";
  }
}
