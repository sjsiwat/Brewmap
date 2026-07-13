import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cafes } from "@/lib/cafes";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CafeDetail } from "@/components/cafe-detail";

interface CafePageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return cafes.map((cafe) => ({ slug: cafe.slug }));
}

export async function generateMetadata({
  params,
}: CafePageProps): Promise<Metadata> {
  const { slug } = await params;
  const cafe = cafes.find((c) => c.slug === slug);

  return {
    title: cafe ? cafe.name : "Café not found",
    description: cafe ? cafe.specialty : undefined,
  };
}

export default async function CafePage({ params }: CafePageProps) {
  const { slug } = await params;
  const cafe = cafes.find((c) => c.slug === slug);

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
