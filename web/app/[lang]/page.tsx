import { SiteHeader } from "@/components/site-header";
import { Hero } from "@/components/hero";
import { FeatureShowcase } from "@/components/feature-showcase";
import { CapabilityIndex } from "@/components/capability-index";
import { Process } from "@/components/process";
import { FinalCta } from "@/components/final-cta";
import { SiteFooter } from "@/components/site-footer";
import type { Metadata } from "next";
import { languageAlternates, pageLanguage, type LangParams } from "@/lib/i18n/server";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  const { lang } = await pageLanguage(params);
  return { alternates: languageAlternates(lang, "/") };
}

export default async function Home({ params }: LangParams) {
  const { lang } = await pageLanguage(params);
  return (
    <div id="top" className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col">
        <Hero lang={lang} />
        <FeatureShowcase />
        <CapabilityIndex lang={lang} />
        <Process lang={lang} />
        <FinalCta lang={lang} />
      </main>
      <SiteFooter lang={lang} />
    </div>
  );
}
