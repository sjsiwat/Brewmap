import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { languageAlternates, pageLanguage, type LangParams } from "@/lib/i18n/server";
import { CafeFinder } from "@/components/cafe-finder";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  const { lang, t } = await pageLanguage(params);
  return {
    title: t.meta.cafesTitle,
    description: t.meta.cafesDescription,
    alternates: languageAlternates(lang, "/cafes"),
  };
}

export default async function CafesPage({ params }: LangParams) {
  const { lang, t } = await pageLanguage(params);
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col">
        <section>
          <div className="page-container pt-5 md:pt-10">
            <h1 className="font-display text-2xl tracking-tight text-ink sm:text-3xl md:text-4xl">
              {t.finder.heading}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft max-sm:hidden md:text-base">
              {t.finder.intro}
            </p>
          </div>
        </section>

        <section>
          <div className="page-container pt-2 pb-12 md:pt-4 md:pb-16">
            <CafeFinder />
          </div>
        </section>
      </main>
      <SiteFooter lang={lang} />
    </div>
  );
}
