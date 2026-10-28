import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CafeFinder } from "@/components/cafe-finder";

export const metadata: Metadata = {
  title: "Find your café",
  description:
    "Ask the AI finder or filter 173 Chiang Mai cafés by budget, distance, parking and drink — not just star rating.",
};

export default function CafesPage() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col">
        <section>
          <div className="page-container pt-5 md:pt-10">
            <h1 className="font-display text-2xl tracking-tight text-ink sm:text-3xl md:text-4xl">
              Chiang Mai cafés, one taste at a time.
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft max-sm:hidden md:text-base">
              Search a café by name, or describe what you feel like in Thai or English and the AI sets the filters.
            </p>
          </div>
        </section>

        <section>
          <div className="page-container pt-2 pb-12 md:pt-4 md:pb-16">
            <CafeFinder />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
