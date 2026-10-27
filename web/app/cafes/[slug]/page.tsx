import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllCafeSlugs, getCafe } from "@/lib/api";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CafeDetail } from "@/components/cafe-detail";

interface CafePageProps {
  params: Promise<{ slug: string }>;
}

// Static + ISR: café data changes rarely, so pages are cached and refreshed hourly.
export const revalidate = 3600;
const cached = { next: { revalidate: 3600 } } satisfies RequestInit;

export async function generateStaticParams() {
  try {
    const slugs = await getAllCafeSlugs(cached);
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
  const { slug } = await params;
  const cafe = await getCafe(slug, cached);

  return {
    title: cafe ? cafe.name : "Café not found",
    description: cafe ? cafe.specialty : undefined,
  };
}

export default async function CafePage({ params }: CafePageProps) {
  const { slug } = await params;
  const cafe = await getCafe(slug, cached);

  if (!cafe) {
    notFound();
  }

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col">
        <CafeDetail cafe={cafe} />
      </main>
      <SiteFooter />
    </div>
  );
}
