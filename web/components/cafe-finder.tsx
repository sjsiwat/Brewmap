"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ChevronDown,
  MapPin,
  ParkingCircle,
  PawPrint,
  Star,
} from "lucide-react";
import {
  cafes,
  distanceToCafe,
  distanceOptions,
  drinkTypeOptions,
  parkingOptions,
  formatPrice,
  priceOptions,
  type MatchOption,
} from "@/lib/cafes";
import { formatKm } from "@/lib/geo";
import { useUserLocation } from "@/lib/use-user-location";
import { LocationOrigin } from "@/components/location-origin";
import { Reveal } from "@/components/reveal";

interface Criteria {
  price: string;
  distance: string;
  parking: string;
  drinkType: string;
}

const defaultCriteria: Criteria = {
  price: "Any",
  distance: "Any",
  parking: "Any",
  drinkType: "Any",
};

const fields: Array<{
  key: keyof Criteria;
  label: string;
  options: MatchOption[];
}> = [
  { key: "price", label: "Price", options: priceOptions },
  { key: "distance", label: "Distance", options: distanceOptions },
  { key: "parking", label: "Parking", options: parkingOptions },
  { key: "drinkType", label: "Drink type", options: drinkTypeOptions },
];

function findOption(options: MatchOption[], label: string) {
  return options.find((option) => option.label === label);
}

export function CafeFinder() {
  const [draft, setDraft] = useState<Criteria>(defaultCriteria);
  const [applied, setApplied] = useState<Criteria | null>(null);
  const { origin } = useUserLocation();

  const results = useMemo(() => {
    const withDistance = cafes.map((cafe) => ({
      cafe,
      distanceKm: distanceToCafe(origin, cafe),
    }));

    if (!applied) {
      return withDistance
        .sort((a, b) => b.cafe.rating - a.cafe.rating)
        .map((entry) => ({ ...entry, matchPercent: null as number | null }));
    }

    const activeFields = fields.filter((field) => applied[field.key] !== "Any");

    return withDistance
      .map(({ cafe, distanceKm }) => {
        const score = activeFields.reduce((total, field) => {
          const option = findOption(field.options, applied[field.key]);
          return option?.test?.(cafe, { distanceKm }) ? total + 1 : total;
        }, 0);
        const matchPercent =
          activeFields.length > 0
            ? Math.round((score / activeFields.length) * 100)
            : null;
        return { cafe, distanceKm, score, matchPercent };
      })
      .sort((a, b) => b.score - a.score || b.cafe.rating - a.cafe.rating);
  }, [applied, origin]);

  const activeCount = applied
    ? fields.filter((field) => applied[field.key] !== "Any").length
    : 0;

  return (
    <div>
      <Reveal>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setApplied(draft);
          }}
          className="border border-line bg-paper-raised"
        >
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <span className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-muted">
              Match engine
            </span>
            <span className="flex items-center gap-1.5 font-mono text-[0.65rem] uppercase tracking-[0.16em] text-rust">
              <span className="h-1.5 w-1.5 bg-rust" aria-hidden />
              {applied ? `${activeCount} filter${activeCount === 1 ? "" : "s"} applied` : "Set your preferences"}
            </span>
          </div>

          {fields.map((field, i) => (
            <div
              key={field.key}
              className={`relative flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-ink/[0.03] focus-within:outline focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-rust ${
                i !== fields.length - 1 ? "border-b border-line" : ""
              }`}
            >
              <label
                htmlFor={field.key}
                className="pointer-events-none font-mono text-[0.65rem] uppercase tracking-[0.16em] text-muted"
              >
                {field.label}
              </label>
              <span className="pointer-events-none flex items-center gap-1.5 font-sans text-sm text-ink-soft">
                {draft[field.key]}
                <ChevronDown size={13} className="text-muted" aria-hidden />
              </span>
              <select
                id={field.key}
                value={draft[field.key]}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, [field.key]: event.target.value }))
                }
                aria-label={field.label}
                className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent opacity-0"
              >
                {field.options.map((option) => (
                  <option key={option.label} value={option.label}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ))}

          <button
            type="submit"
            className="flex w-full items-center justify-between gap-4 border-t border-ink bg-ink px-5 py-4 text-left transition-colors hover:bg-ink/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-rust"
          >
            <div>
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-rust">
                Confirm
              </p>
              <p className="mt-1 font-display text-lg text-paper">
                Find matching cafés
              </p>
            </div>
            <ArrowUpRight className="shrink-0 text-paper/60" size={20} aria-hidden />
          </button>
        </form>
      </Reveal>

      <div className="mt-6">
        <LocationOrigin />
      </div>

      <p className="mt-3 font-mono text-xs uppercase tracking-[0.1em] text-muted">
        {results.length} café{results.length === 1 ? "" : "s"}
        {applied ? " ranked by match" : " · sorted by rating"}
      </p>

      <div className="mt-6 border-t border-ink">
        {results.map(({ cafe, distanceKm, matchPercent }, i) => {
          return (
            <Reveal key={cafe.slug} delay={Math.min(i * 0.03, 0.3)}>
              <Link href={`/cafes/${cafe.slug}`} className="block">
                <motion.div
                  whileHover="hover"
                  initial="rest"
                  animate="rest"
                  className="group grid grid-cols-1 gap-3 border-b border-line py-7 md:grid-cols-12 md:items-baseline md:gap-6"
                >
                  <span className="font-mono text-sm text-muted md:col-span-1">
                    {cafe.index}
                  </span>

                  <motion.div
                    variants={{ rest: { x: 0 }, hover: { x: 6 } }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="md:col-span-4"
                  >
                    <h3 className="font-display text-2xl text-ink">{cafe.name}</h3>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                      <MapPin size={12} aria-hidden />
                      {cafe.area} · {formatKm(distanceKm)}
                    </p>
                  </motion.div>

                  <div className="md:col-span-4">
                    <p className="text-sm leading-relaxed text-ink-soft">
                      {cafe.specialty}
                    </p>
                    <p className="mt-1 text-xs text-muted">{cafe.flavor}</p>
                    <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[0.65rem] uppercase tracking-[0.08em] text-muted">
                      {cafe.tags.map((tag) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-2 md:col-span-3 md:flex-col md:items-end">
                    {matchPercent !== null && (
                      <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-rust">
                        {matchPercent}% match
                      </p>
                    )}

                    <div className="flex items-center gap-1.5 text-xs text-ink">
                      <Star size={12} className="fill-current text-rust" aria-hidden />
                      {cafe.rating.toFixed(1)}
                      <span className="text-muted">({cafe.reviewCount})</span>
                    </div>

                    <div className="flex items-center gap-2 text-muted">
                      {cafe.petFriendly && <PawPrint size={14} aria-label="Pet friendly" />}
                      {cafe.parking && <ParkingCircle size={14} aria-label="Parking available" />}
                    </div>

                    <p className="font-display text-lg text-rust">{formatPrice(cafe.priceAvg)}</p>

                    <motion.span
                      variants={{ rest: { opacity: 0, x: -4 }, hover: { opacity: 1, x: 0 } }}
                      transition={{ duration: 0.25 }}
                      className="hidden items-center gap-1 font-mono text-[0.65rem] uppercase tracking-[0.1em] text-rust md:flex"
                    >
                      View details
                      <ArrowUpRight size={14} aria-hidden />
                    </motion.span>
                  </div>
                </motion.div>
              </Link>
            </Reveal>
          );
        })}

        {results.length === 0 && (
          <p className="border-b border-line py-10 text-sm text-muted">
            No cafés match that combination yet — try loosening a filter.
          </p>
        )}
      </div>
    </div>
  );
}
