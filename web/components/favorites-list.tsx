"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, MapPin, RotateCw, Star } from "lucide-react";
import { FavoriteButton } from "@/components/favorite-button";
import { useAuth } from "@/lib/auth";
import { formatPrice } from "@/lib/cafes";
import { useFavorites } from "@/lib/favorites";

const statusText = "font-mono text-xs uppercase tracking-[0.1em] text-muted";

export function FavoritesList() {
  const { status, user } = useAuth();
  const favorites = useFavorites();
  const router = useRouter();

  useEffect(() => {
    if (status === "anonymous") router.replace("/login?next=%2Fme%2Ffavorites");
  }, [status, router]);

  if (status !== "authenticated" || favorites.status === "loading" || favorites.status === "idle") {
    return (
      <p className={statusText} aria-live="polite">
        Loading your cafés…
      </p>
    );
  }

  if (favorites.status === "error") {
    return (
      <div role="alert">
        <p className="text-base text-ink-soft">We couldn&apos;t load your saved cafés.</p>
        <button
          type="button"
          onClick={favorites.reload}
          className="mt-6 inline-flex items-center gap-2 border border-ink px-4 py-2 font-mono text-xs uppercase tracking-[0.1em] text-ink transition-colors hover:bg-ink hover:text-paper focus-ring"
        >
          <RotateCw size={14} aria-hidden />
          Try again
        </button>
      </div>
    );
  }

  if (favorites.cafes.length === 0) {
    return (
      <div>
        <p className="max-w-md text-base leading-relaxed text-ink-soft">
          Nothing saved yet, {user?.displayName}. Tap the heart on any café and it lands here.
        </p>
        <Link
          href="/cafes"
          className="mt-6 inline-flex items-center gap-2 btn-outline"
        >
          Find your café
          <ArrowUpRight size={14} aria-hidden />
        </Link>
      </div>
    );
  }

  return (
    <div>
      <p className={statusText} aria-live="polite">
        {favorites.cafes.length} saved café{favorites.cafes.length === 1 ? "" : "s"} · newest first
      </p>
      <ul className="mt-6 border-t border-ink">
        {favorites.cafes.map((cafe) => (
          <li key={cafe.slug} className="relative">
            <Link
              href={`/cafes/${cafe.slug}`}
              className="group grid grid-cols-1 gap-2 border-b border-line py-6 pr-10 md:grid-cols-12 md:items-baseline md:gap-6"
            >
              <div className="md:col-span-5">
                <h2 className="font-display text-2xl text-ink transition-colors group-hover:text-rust">
                  {cafe.name}
                </h2>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                  <MapPin size={12} aria-hidden />
                  {cafe.area}
                </p>
              </div>
              <p className="text-sm leading-relaxed text-ink-soft md:col-span-4">{cafe.specialty}</p>
              <div className="flex items-center gap-4 md:col-span-3 md:justify-end">
                <span className="flex items-center gap-1.5 text-xs text-ink">
                  <Star size={12} className="fill-current text-rust" aria-hidden />
                  {cafe.rating.toFixed(1)}
                </span>
                <span className="font-display text-lg text-rust">{formatPrice(cafe.priceAvg)}</span>
              </div>
            </Link>
            <FavoriteButton cafe={cafe} className="absolute top-5 right-0 p-1" />
          </li>
        ))}
      </ul>
    </div>
  );
}
