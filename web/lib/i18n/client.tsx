"use client";

import { createContext, useContext, type ReactNode } from "react";
import { localePath, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Dictionary } from "@/lib/i18n/en";

interface I18n {
  lang: Locale;
  t: Dictionary;
  /** A path in the current language: href("/cafes") → "/th/cafes". */
  href: (path: string) => string;
}

const I18nContext = createContext<I18n | null>(null);

/** Set once in the root layout from the URL's /en or /th. */
export function I18nProvider({ lang, children }: { lang: Locale; children: ReactNode }) {
  const value: I18n = { lang, t: getDictionary(lang), href: (path) => localePath(lang, path) };
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside <I18nProvider>");
  return value;
}
