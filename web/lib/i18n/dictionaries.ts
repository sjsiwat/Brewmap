import type { Locale } from "@/lib/i18n/config";
import { en, type Dictionary } from "@/lib/i18n/en";
import { th } from "@/lib/i18n/th";

const dictionaries: Record<Locale, Dictionary> = { en, th };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
