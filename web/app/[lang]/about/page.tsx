import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { languageAlternates, pageLanguage, type LangParams } from "@/lib/i18n/server";
import { AboutContent } from "@/components/about-content";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  const { lang, t } = await pageLanguage(params);
  return {
    title: t.meta.aboutTitle,
    description: t.meta.aboutDescription,
    alternates: languageAlternates(lang, "/about"),
  };
}

export default async function AboutPage({ params }: LangParams) {
  const { lang } = await pageLanguage(params);
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col">
        <AboutContent lang={lang} />
      </main>
      <SiteFooter lang={lang} />
    </div>
  );
}
