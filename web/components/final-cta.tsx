import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { localePath, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { Reveal } from "@/components/reveal";

export function FinalCta({ lang }: { lang: Locale }) {
  const t = getDictionary(lang).home.finalCta;
  return (
    <section className="border-b border-line">
      <div className="page-container py-24 md:py-32">
        <Reveal>
          <div className="flex flex-col items-start gap-8 md:flex-row md:items-end md:justify-between">
            <div className="max-w-xl">
              <h2 className="heading-page">{t.heading}</h2>
              <p className="mt-5 text-base leading-relaxed text-ink-soft">{t.body}</p>
            </div>

            <Link
              href={localePath(lang, "/cafes")}
              className="group flex shrink-0 items-center gap-3 border border-ink px-6 py-4 font-mono text-xs uppercase tracking-[0.12em] text-ink transition-colors hover:border-rust hover:bg-rust hover:text-paper focus-ring"
            >
              {t.button}
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
