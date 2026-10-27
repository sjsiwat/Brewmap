import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CafeFinder } from "@/components/cafe-finder";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "Find your café",
  description:
    "Browse Chiang Mai cafés by budget, distance, parking, and drink — not just star rating.",
};

export default function CafesPage() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col">
        <section className="border-b border-line">
          <div className="mx-auto max-w-6xl px-6 pt-16 pb-12 md:px-10 md:pt-24 md:pb-16">
            <Reveal>
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-rust">
                Chiang Mai — matched to you
              </p>
              <h1 className="mt-6 max-w-2xl font-display text-4xl tracking-tight text-ink sm:text-5xl">
                Chiang Mai cafés, one taste at a time.
              </h1>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-ink-soft">
                Set what you&apos;re after — price, distance, parking, even
                the drink itself — and confirm to see every café that
                matches.
              </p>
            </Reveal>
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-16">
            <CafeFinder />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
