import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FavoritesList } from "@/components/favorites-list";

export const metadata: Metadata = {
  title: "Your saved cafés",
  description: "The Chiang Mai cafés you saved on BrewMap.",
  robots: { index: false },
};

export default function FavoritesPage() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col">
        <section className="border-b border-line">
          <div className="page-container pt-16 pb-12 md:pt-24 md:pb-16">
            <p className="eyebrow">Your shortlist</p>
            <h1 className="mt-6 max-w-2xl heading-page">
              Cafés you saved for later.
            </h1>
          </div>
        </section>
        <section className="flex-1">
          <div className="page-container py-12 md:py-16">
            <FavoritesList />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
