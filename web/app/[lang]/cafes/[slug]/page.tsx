import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTopCafeSlugs, getCafe, getGoogleReviews, type GoogleReview } from "@/lib/api";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CafeDetail } from "@/components/cafe-detail";
import { CafeReviews } from "@/components/cafe-reviews";
import { GoogleReviews } from "@/components/google-reviews";
import { languageAlternates, pageLanguage, type LangParams } from "@/lib/i18n/server";

type CafePageProps = LangParams<{ slug: string }>;

// Static + ISR: café data changes rarely, so pages are cached and refreshed hourly.
export const revalidate = 3600;
const cached = { next: { revalidate: 3600 } } satisfies RequestInit;

// The most visited cafés are built ahead; any other café is rendered on its
// first visit and then cached the same way. Building all 1,000+ (× 2
// languages) would make every deploy slow and hammer the API.
const PRERENDERED = 200;
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const slugs = await getTopCafeSlugs(PRERENDERED, cached);
    return slugs.map((slug) => ({ slug }));
  } catch (error) {
    // Lets `next build` succeed without the API running: pages are then
    // rendered on first request and cached like the prerendered ones.
    console.warn(
      `[cafes/[slug]] API unavailable at build time, skipping prerender: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return [];
  }
}

export async function generateMetadata({
  params,
}: CafePageProps): Promise<Metadata> {
  const { lang, t } = await pageLanguage(params);
  const { slug } = await params;
  const cafe = await getCafe(slug, cached, lang);

  return {
    title: cafe ? cafe.name : t.meta.cafeNotFound,
    description: cafe ? cafe.specialty : undefined,
    alternates: languageAlternates(lang, `/cafes/${slug}`),
  };
}

export default async function CafePage({ params }: CafePageProps) {
  const { lang } = await pageLanguage(params);
  const { slug } = await params;
  const cafe = await getCafe(slug, cached, lang);

  if (!cafe) {
    notFound();
  }
  // Optional: if they can't be loaded the page still renders, just without them.
  const googleReviews = await getGoogleReviews(slug, cached).catch((): GoogleReview[] => []);

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col">
        <CafeDetail cafe={cafe} lang={lang} />
        <GoogleReviews cafe={cafe} reviews={googleReviews} lang={lang} />
        {/* Client-side, so reviews stay fresh while the page itself is cached (ISR). */}
        <CafeReviews slug={cafe.slug} cafeName={cafe.name} />
      </main>
      <SiteFooter lang={lang} />
    </div>
  );
}
