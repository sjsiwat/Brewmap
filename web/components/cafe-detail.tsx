import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Minus,
  Plus,
  Sparkles,
  Clock,
  MapPin,
  ParkingCircle,
  PawPrint,
  Star,
} from "lucide-react";
import type { Cafe } from "@/lib/cafes";
import { formatPrice, osmEmbedUrl, osmViewUrl } from "@/lib/cafes";
import { DistanceFromOrigin } from "@/components/location-origin";
import { format, intlLocale, localePath, plural, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { FavoriteButton } from "@/components/favorite-button";
import { OpenStatusText, WeeklyHours } from "@/components/opening-hours";
import { Reveal } from "@/components/reveal";

interface Fact {
  label: string;
  value: ReactNode;
  icon: typeof Clock;
}

export function CafeDetail({ cafe, lang }: { cafe: Cafe; lang: Locale }) {
  const t = getDictionary(lang).detail;
  const hoursText = getDictionary(lang).hours;
  const facts: Fact[] = [
    {
      label: t.hours,
      // Unknown week: fall back to the one-line summary rather than guess open/closed.
      value: cafe.openingHours ? <OpenStatusText periods={cafe.openingHours} /> : cafe.hours,
      icon: Clock,
    },
    {
      label: t.rating,
      value: plural(t.ratingValue, cafe.reviewCount, {
        rating: cafe.rating.toFixed(1),
        n: cafe.reviewCount.toLocaleString(intlLocale[lang]),
      }),
      icon: Star,
    },
    { label: t.petFriendly, value: cafe.petFriendly ? t.yes : t.no, icon: PawPrint },
    { label: t.parking, value: cafe.parking ? t.yes : t.no, icon: ParkingCircle },
  ];

  return (
    <section className="border-b border-line">
      <div className="page-container py-16 md:py-20">
        <Reveal>
          <div className="flex items-center justify-between gap-6">
            <Link
              href={localePath(lang, "/cafes")}
              className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.1em] text-muted transition-colors hover:text-rust focus-ring"
            >
              <ArrowLeft size={14} aria-hidden />
              {t.allCafes}
            </Link>
            <FavoriteButton cafe={cafe} showLabel />
          </div>

          <p className="mt-8 flex items-center gap-1.5 eyebrow">
            <MapPin size={13} aria-hidden />
            {cafe.area} · {cafe.address}
          </p>
          <h1 className="mt-3 max-w-2xl heading-page">
            {cafe.name}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-soft">
            {format(t.description, {
              specialty: cafe.specialty,
              flavor: cafe.flavor.toLowerCase(),
              atmosphere: cafe.atmosphere.toLowerCase(),
            })}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4 font-mono text-[0.65rem] uppercase tracking-[0.1em] text-muted">
            <span>{formatPrice(cafe.priceAvg)}</span>
            <DistanceFromOrigin lat={cafe.lat} lng={cafe.lng} />
            {cafe.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        </Reveal>

        {cafe.aiSummary && (cafe.aiSummary.pros.length > 0 || cafe.aiSummary.cons.length > 0) && (
          <Reveal delay={0.05}>
            <div id="reviewers-say" className="mt-12 grid scroll-mt-24 grid-cols-1 gap-8 border-t border-ink pt-6 md:grid-cols-12">
              <div className="md:col-span-4">
                <p className="flex items-center gap-2 font-mono text-[0.65rem] uppercase tracking-[0.16em] text-rust">
                  <Sparkles size={13} aria-hidden />
                  {t.reviewersSay}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-muted">
                  {t.summarised}
                </p>
              </div>
              {cafe.aiSummary.pros.length > 0 && (
                <div className="md:col-span-4">
                  <p className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-muted">{t.loved}</p>
                  <ul className="mt-2 space-y-1.5 text-sm text-ink">
                    {cafe.aiSummary.pros.map((pro) => (
                      <li key={pro} className="flex gap-2">
                        <Plus size={14} className="mt-0.5 shrink-0 text-rust" aria-hidden />
                        {pro}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {cafe.aiSummary.cons.length > 0 && (
                <div className="md:col-span-4">
                  <p className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-muted">{t.watchOut}</p>
                  <ul className="mt-2 space-y-1.5 text-sm text-ink-soft">
                    {cafe.aiSummary.cons.map((con) => (
                      <li key={con} className="flex gap-2">
                        <Minus size={14} className="mt-0.5 shrink-0 text-muted" aria-hidden />
                        {con}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Reveal>
        )}

        <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-12">
          <Reveal delay={0.05} className="lg:col-span-5">
            <dl className="border-t border-ink">
              {facts.map((fact) => (
                <div
                  key={fact.label}
                  className="flex items-center justify-between gap-4 border-b border-line py-4"
                >
                  <dt className="flex items-center gap-2 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-muted">
                    <fact.icon size={14} aria-hidden />
                    {fact.label}
                  </dt>
                  <dd className="text-right text-sm text-ink">{fact.value}</dd>
                </div>
              ))}
            </dl>
            {cafe.openingHours && (
              <div className="border-b border-line py-4">
                <p className="label-mono">{hoursText.week}</p>
                <div className="mt-3">
                  <WeeklyHours periods={cafe.openingHours} />
                </div>
              </div>
            )}
          </Reveal>

          <Reveal delay={0.1} className="lg:col-span-7">
            <div className="border border-line bg-paper-raised">
              <div className="flex items-center justify-between border-b border-line px-5 py-3">
                <span className="label-mono">{t.location}</span>
                <a
                  href={osmViewUrl(cafe.lat, cafe.lng)}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-rust hover:underline focus-ring"
                >
                  {t.largerMap}
                </a>
              </div>
              <iframe
                title={format(t.mapTitle, { name: cafe.name })}
                src={osmEmbedUrl(cafe.lat, cafe.lng)}
                loading="lazy"
                className="h-72 w-full border-0 sm:h-80"
              />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
