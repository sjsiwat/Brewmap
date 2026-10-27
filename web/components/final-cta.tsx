import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/reveal";

export function FinalCta() {
  return (
    <section className="border-b border-line">
      <div className="page-container py-24 md:py-32">
        <Reveal>
          <div className="flex flex-col items-start gap-8 md:flex-row md:items-end md:justify-between">
            <div className="max-w-xl">
              <h2 className="heading-page">
                Still not sure where to go for coffee today?
              </h2>
              <p className="mt-5 text-base leading-relaxed text-ink-soft">
                Tell BrewMap what you&apos;re craving. It&apos;ll do the
                deciding — and tell you exactly why it picked that café.
              </p>
            </div>

            <Link
              href="/cafes"
              className="group flex shrink-0 items-center gap-3 border border-ink px-6 py-4 font-mono text-xs uppercase tracking-[0.12em] text-ink transition-colors hover:border-rust hover:bg-rust hover:text-paper focus-ring"
            >
              Let&apos;s find your cup
              <ArrowUpRight
                size={16}
                className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                aria-hidden
              />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
