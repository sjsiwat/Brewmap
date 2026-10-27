/**
 * Site copy. Everything here describes what BrewMap really does today - no
 * features, numbers or quotes the product can't back up.
 */

export interface NavLink {
  label: string;
  href: string;
}

export const navLinks: NavLink[] = [
  { label: "Discover", href: "/#discover" },
  { label: "Features", href: "/#features" },
  { label: "How it Works", href: "/#process" },
  { label: "About", href: "/about" },
];

/** How many cafés are in the database (Google Maps listings, Chiang Mai). */
export const CAFE_COUNT = 173;

export interface StatItem {
  value: string;
  label: string;
}

export const heroStats: StatItem[] = [
  { value: String(CAFE_COUNT), label: "Real cafés in Chiang Mai" },
  { value: "TH · EN", label: "Ask the AI finder in either" },
  { value: String(CAFE_COUNT), label: "AI review summaries" },
];

/** A café page with an AI summary, Google reviews and community reviews, for linking to. */
const SAMPLE_CAFE = "/cafes/the-baristro-asian-style";

export interface Feature {
  index: string;
  name: string;
  description: string;
  category: string;
  detail: string;
  /** A page, opened at its top - never a #section, which lands mid-page. */
  href: string;
  cta: string;
}

export const features: Feature[] = [
  {
    index: "01",
    name: "AI Finder, Filters & Sort",
    description:
      "Describe what you want in a sentence, in Thai or English, and Gemini picks real cafés with the reason each one fits. Or filter by price, distance, parking and drink type yourself, and sort by rating, distance, review count or price.",
    category: "Discovery",
    detail: "If nothing matches every wish, the finder says which one it let go of.",
    href: "/cafes",
    cta: "Find a café",
  },
  {
    index: "02",
    name: "Reviews & AI Summary",
    description:
      "Each café page shows what people loved and what to watch out for, summarised by AI, the latest Google reviews, and BrewMap's own community reviews. Log in to rate a café and write yours.",
    category: "Insights",
    detail: `AI summaries for all ${CAFE_COUNT} cafés. Google reviews are shown without names or owner replies.`,
    href: SAMPLE_CAFE,
    cta: "See an example",
  },
  {
    index: "03",
    name: "Saved Cafés",
    description:
      "Tap the heart on any café to keep it on your shortlist, and find them all in one place later.",
    category: "Personal",
    detail: "Tied to your account, so they follow you between devices.",
    href: "/me/favorites",
    cta: "Your saved cafés",
  },
  {
    index: "04",
    name: "Café Pages",
    description:
      "Hours, Google rating, price, parking, pets, tags and a map for each café, with the distance from you.",
    category: "Details",
    detail: "Open the map in OpenStreetMap for directions.",
    href: "/cafes/twenty-mar",
    cta: "View a café",
  },
];

export interface Capability {
  label: string;
  description: string;
}

/** What the filters and the AI finder actually work with. */
export const capabilities: Capability[] = [
  { label: "Drink type", description: "Coffee, tea (matcha included) or non-coffee." },
  { label: "Specialty & tags", description: "Quiet, work-friendly, roastery, matcha, dessert, garden and more." },
  { label: "Area", description: "17 areas, from Nimman and the Old City to Mae Rim." },
  { label: "Budget", description: "Typical drink price in baht." },
  { label: "Distance", description: "From your location, or Tha Phae Gate if you'd rather not share." },
  { label: "Parking & pets", description: "Somewhere to park, and whether your dog can come." },
  { label: "Ratings & reviews", description: "Google rating and reviews, plus BrewMap's own community rating." },
];

export interface ProcessStep {
  index: string;
  title: string;
  description: string;
}

export const processSteps: ProcessStep[] = [
  {
    index: "01",
    title: "Describe",
    description:
      "Type what you're after, like “quiet café with parking near Nimman”, or set the filters yourself.",
  },
  {
    index: "02",
    title: "Filter",
    description:
      "The AI turns your sentence into filters, and the server checks every one before it searches.",
  },
  {
    index: "03",
    title: "Match",
    description:
      "You get up to five cafés, each with a short reason written only from that café's data.",
  },
  {
    index: "04",
    title: "Save & review",
    description:
      "Keep the ones you like, then come back after your visit to rate and review.",
  },
];

export interface AboutFact {
  label: string;
  value: string;
}

export const aboutFacts: AboutFact[] = [
  { label: "Maker", value: "Siwat Jankam" },
  { label: "Role", value: "Solo developer & designer" },
  { label: "Based in", value: "Chiang Mai, Thailand" },
  { label: "Built with", value: "Next.js, NestJS, MongoDB, Gemini" },
  { label: "Status", value: "Prototype, live and iterating" },
];

export const aboutCopy = {
  eyebrow: "About",
  heading: "One person, one bad coffee decision too many.",
  paragraphs: [
    "BrewMap started as a database design exercise: three collections, a handful of mock orders, nothing more. But the real problem behind it was personal: too many afternoons spent scrolling reviews for a café that turned out too loud, too far, or nothing like what I actually wanted to drink.",
    "So I kept building. What began as a schema became a full product: a Next.js site, a NestJS API on MongoDB, accounts, saved cafés, community reviews and an AI finder.",
    `The ${CAFE_COUNT} cafés come from real Google Maps listings. Their specialties, tags and review summaries were derived from real review text with AI, so double-check hours and prices before you go.`,
  ],
};
