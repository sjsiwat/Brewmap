/**
 * Site structure: links and numbers. The words themselves live in
 * lib/i18n/en.ts and th.ts, and describe only what BrewMap really does today.
 */

/** How many cafés are in the database (Google Maps listings, Chiang Mai). */
export const CAFE_COUNT = 173;

/** Home-page sections and pages, by their key in the dictionary's `nav`. */
export const navLinks = [
  { key: "discover", href: "/#discover" },
  { key: "features", href: "/#features" },
  { key: "howItWorks", href: "/#process" },
  { key: "about", href: "/about" },
] as const;

/** The hero's three numbers; their labels are `home.hero.stats`, in order. */
export const heroStatValues = [String(CAFE_COUNT), "TH · EN", String(CAFE_COUNT)];

/**
 * Where each feature on the home page leads, in the order of
 * `home.features.items`. A page, opened at its top - never a #section, which
 * lands mid-page. The second is a café with an AI summary, Google reviews and
 * community reviews.
 */
export const featureLinks = ["/cafes", "/cafes/the-baristro-asian-style", "/me/favorites", "/cafes/twenty-mar"];
