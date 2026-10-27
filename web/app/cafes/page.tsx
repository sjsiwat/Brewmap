import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AiFinder } from "@/components/ai-finder";
import { CafeFinder } from "@/components/cafe-finder";
import { Reveal } from "@/components/reveal";

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
        <section className="border-b border-line">
          <div className="page-container pt-16 pb-12 md:pt-24 md:pb-16">
            <Reveal>
              <p className="eyebrow">
                Chiang Mai — matched to you
              </p>
              <h1 className="mt-6 max-w-2xl heading-page">
                Chiang Mai cafés, one taste at a time.
              </h1>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-ink-soft">
                Ask the AI finder in a sentence, Thai or English — or set
                price, distance, parking and drink yourself and confirm to see
                every café that matches.
              </p>
            </Reveal>
          </div>
        </section>

        <section>
          <div className="page-container py-12 md:py-16">
            <AiFinder />
            <p id="filters" className="mt-12 mb-6 scroll-mt-24 font-mono text-xs uppercase tracking-[0.16em] text-muted">
              Or set the filters yourself
            </p>
            <CafeFinder />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
