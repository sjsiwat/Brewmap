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
          <div className="mx-auto max-w-6xl px-6 pt-16 pb-12 md:px-10 md:pt-24 md:pb-16">
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-rust">Your shortlist</p>
            <h1 className="mt-6 max-w-2xl font-display text-4xl tracking-tight text-ink sm:text-5xl">
              Cafés you saved for later.
            </h1>
          </div>
        </section>
        <section className="flex-1">
          <div className="mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-16">
            <FavoritesList />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
