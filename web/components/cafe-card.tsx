"use client";

import Link from "next/link";
import { ParkingCircle, PawPrint, Sparkles, Star } from "lucide-react";
import type { CafeResult } from "@/lib/api";
import { formatPrice } from "@/lib/cafes";
import { formatKm } from "@/lib/geo";
import { dataLabel, intlLocale, plural } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/client";
import { FavoriteButton } from "@/components/favorite-button";
import { OpenStatusText } from "@/components/opening-hours";

const MAX_TAGS = 3;

/**
 * One café in the list: name → where and whether it's open → rating and price
 * → what to order → a few tags. The whole card is the link (the name's link
 * stretches over it); ♡ sits above it and works on its own.
 */
export function CafeCard({ cafe, reason }: { cafe: CafeResult; reason?: string }) {
  const { lang, t: dict, href } = useI18n();
  const t = dict.card;
  // Parking and pets get their own labelled chip below, so skip the same tag.
  const tags = cafe.tags
    .filter((tag) => !(cafe.parking && tag === "Parking") && !(cafe.petFriendly && tag === "Pet-friendly"))
    .slice(0, MAX_TAGS);
  return (
    <article className="group relative flex h-full flex-col border border-line bg-paper p-5 transition-colors hover:border-ink md:p-6">
      <h3 className="pr-10 font-display text-2xl leading-tight text-ink transition-colors group-hover:text-rust">
        <Link
          href={href(`/cafes/${cafe.slug}`)}
          className="outline-none after:absolute after:inset-0 focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-rust"
        >
          {cafe.name}
        </Link>
      </h3>

      <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-soft">
        <span>{dataLabel(dict.areas, cafe.area)}</span>
        {cafe.distanceKm !== undefined && (
          <>
            <span aria-hidden>·</span>
            <span>{formatKm(cafe.distanceKm, dict.units.km)}</span>
          </>
        )}
        {cafe.openingHours && (
          <>
            <span aria-hidden>·</span>
            <OpenStatusText periods={cafe.openingHours} />
          </>
        )}
      </p>

      <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-sm text-ink">
        <span className="inline-flex items-center gap-1">
          <Star size={13} className="fill-current text-rust" aria-hidden />
          <span>
            {cafe.rating.toFixed(1)}
            <span className="sr-only"> {t.stars}</span>
          </span>
          <span className="text-ink-soft">
            {plural(t.reviews, cafe.reviewCount, { n: cafe.reviewCount.toLocaleString(intlLocale[lang]) })}
          </span>
        </span>
        <span aria-hidden>·</span>
        <span>
          <span className="sr-only">{t.typicalDrink} </span>
          {formatPrice(cafe.priceAvg)}
        </span>
      </p>

      <p className="mt-3 text-sm leading-relaxed text-ink-soft">{cafe.specialty}</p>

      <ul className="mt-auto flex flex-wrap gap-1.5 pt-4" aria-label={t.highlights}>
        {tags.map((tag) => (
          <li key={tag} className="border border-line px-2 py-0.5 text-xs text-ink-soft">
            {dataLabel(dict.cafeTags, tag)}
          </li>
        ))}
        {cafe.parking && (
          <li className="inline-flex items-center gap-1 border border-line px-2 py-0.5 text-xs text-ink-soft">
            <ParkingCircle size={12} aria-hidden />
            {t.parking}
          </li>
        )}
        {cafe.petFriendly && (
          <li className="inline-flex items-center gap-1 border border-line px-2 py-0.5 text-xs text-ink-soft">
            <PawPrint size={12} aria-hidden />
            {t.pets}
          </li>
        )}
      </ul>

      {reason && (
        <p className="mt-4 flex gap-2 border-t border-line pt-3 text-sm leading-relaxed text-ink">
          <Sparkles size={13} className="mt-1 shrink-0 text-rust" aria-hidden />
          <span>
            <span className="sr-only">{t.whyAi} </span>
            {reason}
          </span>
        </p>
      )}

      {/* Above the stretched link, so it's its own button; a button can't sit inside an <a>. */}
      <FavoriteButton cafe={cafe} className="absolute top-4 right-4 z-10 p-1" />
    </article>
  );
}
