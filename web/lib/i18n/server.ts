import { notFound } from "next/navigation";
import { hasLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Dictionary } from "@/lib/i18n/en";

/** `params` of any page or layout under app/[lang]. */
export interface LangParams<Extra = object> {
  params: Promise<{ lang: string } & Extra>;
}

/** The page's language and text; 404 for a language we don't have. */
export async function pageLanguage(params: Promise<{ lang: string }>): Promise<{ lang: Locale; t: Dictionary }> {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return { lang, t: getDictionary(lang) };
}

/** hreflang links so search engines can offer the other language. `path` is without the /en or /th. */
export function languageAlternates(lang: Locale, path: string) {
  const suffix = path === "/" ? "" : path;
  return {
    canonical: `/${lang}${suffix}`,
    languages: { en: `/en${suffix}`, th: `/th${suffix}` },
  };
}
