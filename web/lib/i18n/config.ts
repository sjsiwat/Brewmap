export const locales = ["en", "th"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";
/** Remembers a visitor's language when they open a path without one (set by proxy.ts). */
export const LOCALE_COOKIE = "NEXT_LOCALE";

export function hasLocale(value: string | undefined): value is Locale {
  return (locales as readonly string[]).includes(value ?? "");
}

/** For Intl number and date formatting. Thai dates use the Buddhist calendar, as Thai readers expect. */
export const intlLocale: Record<Locale, string> = { en: "en-GB", th: "th-TH" };

/** "/cafes" → "/th/cafes"; "/" → "/th"; "/#features" → "/th#features". */
export function localePath(locale: Locale, path: string): string {
  if (path === "/") return `/${locale}`;
  if (path.startsWith("/#") || path.startsWith("/?")) return `/${locale}${path.slice(1)}`;
  return `/${locale}${path}`;
}

/** The same page in another language: "/en/cafes/x?y=1" → "/th/cafes/x?y=1". */
export function switchLocalePath(pathname: string, locale: Locale): string {
  const [, first, ...rest] = pathname.split("/");
  const tail = hasLocale(first) ? rest : [first, ...rest];
  return localePath(locale, `/${tail.filter(Boolean).join("/")}`);
}

/** Fills `{name}` placeholders: format("{n} cafés", { n: 3 }) → "3 cafés". */
export function format(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

/** Picks the singular or plural form, then fills `{n}`. */
export function plural(
  forms: { one: string; other: string },
  n: number,
  values: Record<string, string | number> = {},
): string {
  return format(n === 1 ? forms.one : forms.other, { n, ...values });
}

/** A café tag or area in the page's language; unknown values show as stored. */
export function dataLabel(names: Record<string, string>, value: string): string {
  return names[value] ?? value;
}
