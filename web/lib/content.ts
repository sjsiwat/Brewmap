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

export interface Signal {
  label: string;
  value: string;
}

export const heroSignals: Signal[] = [
  { label: "Flavor", value: "Chocolate, low acidity" },
  { label: "Atmosphere", value: "Quiet, workable" },
  { label: "Budget", value: "~120฿" },
  { label: "Distance", value: "1.2 km" },
];

export const heroMatch = {
  score: "94% match",
  name: "Analog Coffee",
  area: "Nimman, Chiang Mai",
};

export interface StatItem {
  value: string;
  label: string;
}

export const heroStats: StatItem[] = [
  { value: "2 min", label: "Average decision time" },
  { value: "6", label: "Taste signals read per search" },
  { value: "2026", label: "Starting in Chiang Mai" },
];

export interface Feature {
  index: string;
  name: string;
  description: string;
  category: string;
  status: string;
  result: string;
}

export const features: Feature[] = [
  {
    index: "01",
    name: "Coffee Finder",
    description:
      "Describe what you're craving in plain language. The system matches it to real cafés, not keywords.",
    category: "Discovery",
    status: "Live — 2026",
    result: "Cuts café-picking time from 25 minutes to under 2.",
  },
  {
    index: "02",
    name: "Smart Search",
    description:
      "Filter by flavor note, brewing method, and atmosphere — not just neighborhood and star rating.",
    category: "Discovery",
    status: "Live — 2026",
    result: "Surfaces cafés generic map search never would.",
  },
  {
    index: "03",
    name: "Interactive Coffee Map",
    description:
      "Every pin carries a taste profile and specialty, so browsing the map already narrows the choice.",
    category: "Discovery",
    status: "Live — 2026",
    result: "Turns idle browsing into a shortlist.",
  },
  {
    index: "04",
    name: "Review Summary",
    description:
      "Thousands of reviews condensed into what actually matters: what's good, what to expect, what to skip.",
    category: "Insights",
    status: "Beta",
    result: "Replaces 2,000 reviews with three lines worth reading.",
  },
  {
    index: "05",
    name: "Top Lists",
    description:
      "Curated rankings judged one craft at a time — pour-over, matcha, roastery, quiet-work cafés.",
    category: "Editorial",
    status: "Live — 2026",
    result: "Gives every craft its own leaderboard, not one blended score.",
  },
  {
    index: "06",
    name: "Personalized Recommendations",
    description:
      "The system tracks what you actually order and revisit, and sharpens its taste model after every trip.",
    category: "Personalization",
    status: "Rolling out",
    result: "Gets more accurate the more you use it — not more generic.",
  },
];

export interface Capability {
  label: string;
  description: string;
}

export const capabilities: Capability[] = [
  { label: "Coffee style", description: "Latte, flat white, pour-over, cold brew, espresso." },
  { label: "Flavor profile", description: "Chocolate, fruity, floral, low or high acidity." },
  { label: "Brewing method", description: "Manual pour-over, espresso-based, batch, cold." },
  { label: "Atmosphere", description: "Quiet and workable, social, scenic, fast turnover." },
  { label: "Budget", description: "What you'd actually pay for this cup, today." },
  { label: "Distance", description: "How far you're realistically willing to go." },
  { label: "Community reviews", description: "What real visitors noticed, weighted by relevance." },
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
      "Tell BrewMap what you want in a sentence — no filters to configure, no categories to browse first.",
  },
  {
    index: "02",
    title: "Analyze",
    description:
      "The system reads flavor, brewing method, atmosphere, budget, and distance from what you said.",
  },
  {
    index: "03",
    title: "Match",
    description:
      "You get a ranked shortlist — each café attached to the specific reason it was recommended.",
  },
  {
    index: "04",
    title: "Learn",
    description:
      "Every visit refines the model, so the next match is closer to your taste than the last.",
  },
];

export const testimonial = {
  quote:
    "Before BrewMap, we only showed up for people typing ‘coffee near me.’ Now we get customers who searched for quiet, chocolate-forward, no fruit notes — and those are the ones who order the good stuff and stay for two hours. Our weekday afternoons used to be dead. Now they're half our matcha sales.",
  name: "Nualjan Srisawat",
  role: "Owner, Ink & Oat Coffee — Nimman",
};

export const footerSocials = [
  { label: "Instagram", href: "https://instagram.com" },
  { label: "LINE", href: "https://line.me" },
  { label: "X", href: "https://x.com" },
];

export interface AboutFact {
  label: string;
  value: string;
}

export const aboutFacts: AboutFact[] = [
  { label: "Maker", value: "Siwat Jankam" },
  { label: "Role", value: "Solo developer & designer" },
  { label: "Based in", value: "Chiang Mai, Thailand" },
  { label: "Built with", value: "Next.js, TypeScript, Tailwind" },
  { label: "Status", value: "Prototype, actively iterating" },
];

export const aboutCopy = {
  eyebrow: "About",
  heading: "One person, one bad coffee decision too many.",
  paragraphs: [
    "BrewMap started as a database design exercise — three collections, a handful of mock orders, nothing more. But the real problem behind it was personal: too many afternoons spent scrolling reviews for a café that turned out too loud, too far, or nothing like what I actually wanted to drink.",
    "So I kept building. What began as a schema for users, menus, and orders became a full front-end prototype — a chance to think through a product end to end, from data model to the page you're looking at right now.",
    "BrewMap is still a prototype, built solo as coursework in Chiang Mai. The café data here is mocked, but the problem it's solving isn't.",
  ],
};
