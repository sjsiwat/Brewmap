import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { languageAlternates, pageLanguage, type LangParams } from "@/lib/i18n/server";
import { FavoritesList } from "@/components/favorites-list";

export async function generateMetadata({ params }: LangParams): Promise<Metadata> {
  const { lang, t } = await pageLanguage(params);
  return {
    title: t.meta.favoritesTitle,
    description: t.meta.favoritesDescription,
    alternates: languageAlternates(lang, "/me/favorites"),
    robots: { index: false },
  };
}

export default async function FavoritesPage({ params }: LangParams) {
  const { lang, t } = await pageLanguage(params);
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col">
        <section className="border-b border-line">
          <div className="page-container pt-16 pb-12 md:pt-24 md:pb-16">
            <p className="eyebrow">{t.favorites.eyebrow}</p>
            <h1 className="mt-6 max-w-2xl heading-page">{t.favorites.heading}</h1>
          </div>
        </section>
        <section className="flex-1">
          <div className="page-container py-12 md:py-16">
            <FavoritesList />
          </div>
        </section>
      </main>
      <SiteFooter lang={lang} />
    </div>
  );
}
