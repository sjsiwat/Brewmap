"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowUpRight, LocateFixed, Star } from "lucide-react";
import { getCafes, type CafeResult } from "@/lib/api";
import { formatPrice } from "@/lib/cafes";
import { formatKm, haversineKm } from "@/lib/geo";
import { format, intlLocale, plural } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/client";
import { requestUserLocation, useUserLocation } from "@/lib/use-user-location";

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.2 },
  },
};

const rowVariants: Variants = {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

/** Best-rated café this close counts as "near you"; otherwise show the nearest one. */
const NEAR_KM = 3;

interface Pick {
  cafe: CafeResult;
  /** "top": best rated within NEAR_KM. "nearest": nothing that close, so the closest café. */
  basis: "top" | "nearest";
}

/**
 * The hero card: a real café picked for where the visitor is - the best-rated
 * one within 3 km, or the nearest if none is that close. Uses Tha Phae Gate
 * until the visitor shares their location.
 */
export function HeroVisual() {
  const reduceMotion = useReducedMotion();
  const { lang, t: dict, href } = useI18n();
  const t = dict.home.heroCard;
  const place = dict.places.thaPhaeGate;
  const { origin, status } = useUserLocation();
  const [pick, setPick] = useState<Pick | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (status === "locating") return;
    const controller = new AbortController();
    const near = { lat: origin.lat, lng: origin.lng, limit: 1 };
    (async () => {
      const top = await getCafes({ ...near, radiusKm: NEAR_KM, sort: "rating" }, { signal: controller.signal });
      if (top.items[0]) return { cafe: top.items[0], basis: "top" } satisfies Pick;
      const closest = await getCafes({ ...near, sort: "distance" }, { signal: controller.signal });
      return closest.items[0] ? ({ cafe: closest.items[0], basis: "nearest" } satisfies Pick) : null;
    })()
      .then((next) => {
        setPick(next);
        setFailed(next === null);
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => controller.abort();
  }, [origin.lat, origin.lng, status]);

  const fromYou = status === "device";
  const cafe = pick?.cafe;
  const km = cafe ? (cafe.distanceKm ?? haversineKm(origin, cafe)) : null;
  const distance = km === null ? "" : formatKm(km, dict.units.km);
  const signals = [
    { label: t.specialty, value: cafe?.specialty },
    { label: t.atmosphere, value: cafe?.atmosphere },
    { label: t.price, value: cafe ? formatPrice(cafe.priceAvg) : undefined },
    {
      label: t.distance,
      value:
        km === null
          ? undefined
          : fromYou
            ? format(t.fromYou, { km: distance })
            : format(t.fromPlace, { km: distance, place }),
    },
  ];

  return (
    <div className="border border-line bg-paper-raised">
      <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3">
        <span className="label-mono">{fromYou ? t.nearYou : format(t.nearPlace, { place })}</span>
        {status === "locating" ? (
          <span className="label-mono" aria-live="polite">
            {t.locating}
          </span>
        ) : fromYou ? (
          <span className="flex items-center gap-1.5 font-mono text-[0.65rem] uppercase tracking-[0.16em] text-rust">
            <span className="h-1.5 w-1.5 bg-rust" aria-hidden />
            {t.yourLocation}
          </span>
        ) : (
          <button
            type="button"
            onClick={requestUserLocation}
            className="focus-ring inline-flex items-center gap-1.5 font-mono text-[0.65rem] uppercase tracking-[0.16em] text-rust hover:underline"
          >
            <LocateFixed size={12} aria-hidden />
            {t.useMyLocation}
          </button>
        )}
      </div>

      <motion.dl
        initial={reduceMotion ? undefined : "hidden"}
        whileInView={reduceMotion ? undefined : "visible"}
        viewport={{ once: true }}
        variants={reduceMotion ? undefined : containerVariants}
        aria-busy={!cafe && !failed}
      >
        {signals.map((signal, i) => (
          <motion.div
            key={signal.label}
            variants={reduceMotion ? undefined : rowVariants}
            className={`flex items-baseline justify-between gap-4 px-5 py-3.5 ${
              i !== signals.length - 1 ? "border-b border-line" : ""
            }`}
          >
            <dt className="label-mono shrink-0">{signal.label}</dt>
            <dd className="line-clamp-2 text-right font-sans text-sm text-ink-soft">
              {signal.value ?? (failed ? "—" : "…")}
            </dd>
          </motion.div>
        ))}
      </motion.dl>

      <motion.div
        initial={reduceMotion ? undefined : { opacity: 0, y: 8 }}
        whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <Link
          href={href(cafe ? `/cafes/${cafe.slug}` : "/cafes")}
          className="focus-ring group flex items-center justify-between gap-4 border-t border-ink bg-ink px-5 py-4 transition-colors hover:bg-ink/90"
        >
          <div className="min-w-0">
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-rust-bright">
              {!cafe
                ? failed
                  ? t.browseAll
                  : t.finding
                : pick?.basis === "top"
                  ? format(t.topWithin, { km: NEAR_KM })
                  : t.nearest}
            </p>
            {cafe && (
              <>
                <p className="mt-1 truncate font-display text-lg text-paper">{cafe.name}</p>
                <p className="flex items-center gap-1.5 font-sans text-xs text-paper/70">
                  {cafe.area}
                  <span aria-hidden>·</span>
                  <Star size={11} className="fill-current" aria-hidden />
                  {cafe.rating.toFixed(1)}
                  <span className="sr-only">{t.googleRating}</span>
                  <span aria-hidden>·</span>
                  {plural(t.reviews, cafe.reviewCount, { n: cafe.reviewCount.toLocaleString(intlLocale[lang]) })}
                </p>
              </>
            )}
          </div>
          <ArrowUpRight
            className="shrink-0 text-paper/60 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            size={20}
            aria-hidden
          />
        </Link>
      </motion.div>
    </div>
  );
}
