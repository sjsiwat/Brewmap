/** Languages café text can be returned in. English is the original. */
export const LANGS = ['en', 'th'] as const;
export type Lang = (typeof LANGS)[number];
