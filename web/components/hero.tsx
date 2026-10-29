import Link from "next/link";
import { Search } from "lucide-react";
import { heroStatValues } from "@/lib/content";
import { localePath, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { HeroVisual } from "@/components/hero-visual";

export function Hero({ lang }: { lang: Locale }) {
  const t = getDictionary(lang).home.hero;
  return (
    <section id="discover" className="border-b border-line">
      <div className="page-container grid grid-cols-1 gap-12 pt-16 pb-20 md:pt-24 md:pb-28 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-7">
          <p className="eyebrow">{t.eyebrow}</p>

          <h1 className="mt-6 max-w-xl font-display text-5xl leading-[1.05] tracking-tight text-ink sm:text-6xl lg:text-7xl">
            {t.titleLine1}
            <br />
            {t.titleLine2}
          </h1>

          <p className="mt-8 max-w-md text-lg leading-relaxed text-ink-soft">
            {t.body}
          </p>

          <dl className="mt-14 grid max-w-md grid-cols-3 gap-6 border-t border-line pt-6">
            {t.stats.map((label, i) => (
              <div key={label}>
                <dt className="font-display text-2xl text-ink">
                  {heroStatValues[i]}
                </dt>
                <dd className="mt-1 font-mono text-[0.65rem] uppercase leading-tight tracking-[0.1em] text-muted">
                  {label}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="lg:col-span-5 lg:pt-2">
          <HeroVisual />
          <Link
            href={localePath(lang, "/cafes")}
            className="group mt-4 flex items-center justify-center gap-3 border border-rust bg-rust px-6 py-4 font-mono text-xs uppercase tracking-[0.12em] text-paper transition-colors hover:border-ink hover:bg-ink focus-ring"
          >
            <Search size={16} aria-hidden />
            {t.findCup}
          </Link>
        </div>
      </div>
    </section>
  );
}
