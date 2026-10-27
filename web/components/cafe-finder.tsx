"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ChevronDown,
  MapPin,
  ParkingCircle,
  PawPrint,
  RotateCw,
  Search,
  Star,
} from "lucide-react";
import type { CafeQuery } from "@/lib/api";
import {
  distanceOptions,
  drinkTypeOptions,
  parkingOptions,
  formatPrice,
  priceOptions,
  type FilterOption,
} from "@/lib/cafes";
import { formatKm } from "@/lib/geo";
import { useCafeSearch } from "@/lib/use-cafe-search";
import { useUserLocation } from "@/lib/use-user-location";
import { LocationOrigin } from "@/components/location-origin";
import { FavoriteButton } from "@/components/favorite-button";
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
  options: FilterOption[];
}> = [
  { key: "price", label: "Price", options: priceOptions },
  { key: "distance", label: "Distance", options: distanceOptions },
  { key: "parking", label: "Parking", options: parkingOptions },
  { key: "drinkType", label: "Drink type", options: drinkTypeOptions },
];

const PAGE_SIZE = 24;
/** Mirrors SEARCH_MAX in server/src/cafes/dto/query-cafes.dto.ts. */
const NAME_MAX = 60;
/** Wait for a pause in typing before searching, so each keystroke isn't a request. */
const NAME_DEBOUNCE_MS = 300;

/** Strict filtering: every chosen option is sent to the API and must match. */
function toQuery(criteria: Criteria | null): CafeQuery {
  if (!criteria) return {};
  return fields.reduce<CafeQuery>((query, field) => {
    const option = field.options.find((o) => o.label === criteria[field.key]);
    return { ...query, ...option?.query };
  }, {});
}

export function CafeFinder() {
  const [draft, setDraft] = useState<Criteria>(defaultCriteria);
  const [applied, setApplied] = useState<Criteria | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [name, setName] = useState("");
  const { origin } = useUserLocation();

  // The name search applies as you type (after a short pause); the filters
  // below still wait for Confirm.
  useEffect(() => {
    const timer = setTimeout(() => setName(nameInput.trim().replace(/\s+/g, " ")), NAME_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [nameInput]);

  // Always send an origin (the user's location, or the Tha Phae Gate fallback)
  // so every result carries distanceKm and "Within N km" has a centre.
  const search = useCafeSearch({
    ...toQuery(applied),
    q: name || undefined,
    lat: origin.lat,
    lng: origin.lng,
    sort: "rating",
    limit: PAGE_SIZE,
  });

  const activeCount = applied
    ? fields.filter((field) => applied[field.key] !== "Any").length
    : 0;

  return (
    <div>
      <Reveal>
        <div
          role="search"
          className="mb-4 flex items-center gap-3 border border-line bg-paper-raised px-5 py-3.5 focus-within:outline focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-rust"
        >
          <Search size={15} className="shrink-0 text-muted" aria-hidden />
          <label htmlFor="cafe-name" className="sr-only">
            Search cafés by name
          </label>
          <input
            id="cafe-name"
            type="search"
            value={nameInput}
            onChange={(event) => setNameInput(event.target.value)}
            maxLength={NAME_MAX}
            autoComplete="off"
            spellCheck={false}
            placeholder="Search by café name, e.g. Arabica"
            className="w-full min-w-0 border-0 bg-transparent p-0 font-sans text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-0"
          />
        </div>
      </Reveal>

      <Reveal>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setApplied(draft);
          }}
          className="border border-line bg-paper-raised"
        >
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <span className="label-mono">
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
                className="pointer-events-none label-mono"
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
            className="flex w-full items-center justify-between gap-4 border-t border-ink bg-ink px-5 py-4 text-left transition-colors hover:bg-ink/90 focus-ring"
          >
            <div>
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-rust-bright">
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

      <p
        className="mt-3 font-mono text-xs uppercase tracking-[0.1em] text-muted"
        aria-live="polite"
      >
        {search.total === null
          ? search.status === "error"
            ? "Couldn't load cafés"
            : "Loading cafés…"
          : `${search.total} café${search.total === 1 ? "" : "s"}${name ? ` named “${name}”` : ""}${
              activeCount > 0 ? " matching every filter" : ""
            } · sorted by rating`}
      </p>

      <div className="mt-6 border-t border-ink">
        {search.items.map((cafe, i) => {
          return (
            <Reveal
              key={cafe.slug}
              delay={Math.min((i % PAGE_SIZE) * 0.03, 0.3)}
              className="relative"
            >
              <Link href={`/cafes/${cafe.slug}`} className="block">
                <motion.div
                  whileHover="hover"
                  initial="rest"
                  animate="rest"
                  className="group grid grid-cols-1 gap-3 border-b border-line py-7 pr-10 md:grid-cols-12 md:items-baseline md:gap-6"
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
                      {cafe.area}
                      {cafe.distanceKm !== undefined && ` · ${formatKm(cafe.distanceKm)}`}
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
              {/* Outside the link: a button can't be nested inside an <a>. */}
              <FavoriteButton cafe={cafe} className="absolute top-6 right-0 p-1" />
            </Reveal>
          );
        })}

        {search.status === "ready" && search.items.length === 0 && (
          <p className="border-b border-line py-10 text-sm text-muted">
            {name
              ? `No café named “${name}”${activeCount > 0 ? " matches these filters" : " on BrewMap yet"}. Check the spelling${activeCount > 0 ? " or loosen a filter" : ""}.`
              : "No cafés match every filter — try loosening one."}
          </p>
        )}

        {search.status === "loading" && search.items.length === 0 && (
          <div className="space-y-px" aria-hidden>
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="h-24 animate-pulse border-b border-line bg-ink/[0.03]" />
            ))}
          </div>
        )}

        {search.status === "error" && (
          <div
            role="alert"
            className="flex flex-col gap-4 border-b border-line py-10 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-display text-lg text-ink">Couldn&apos;t load cafés.</p>
              <p className="mt-1 text-sm text-muted">
                {search.error?.status === 0
                  ? "The BrewMap API isn't reachable right now."
                  : search.error?.message}
              </p>
            </div>
            <button
              type="button"
              onClick={search.retry}
              className="inline-flex items-center gap-2 self-start border border-ink px-4 py-2 font-mono text-xs uppercase tracking-[0.1em] text-ink transition-colors hover:bg-ink hover:text-paper focus-ring"
            >
              <RotateCw size={14} aria-hidden />
              Try again
            </button>
          </div>
        )}
      </div>

      {(search.hasMore || (search.status === "loading" && search.items.length > 0)) && (
        <button
          type="button"
          onClick={search.loadMore}
          disabled={search.status === "loading"}
          className="mt-8 w-full border border-ink px-5 py-4 font-mono text-xs uppercase tracking-[0.12em] text-ink transition-colors hover:bg-ink hover:text-paper focus-ring disabled:cursor-wait disabled:opacity-60"
        >
          {search.status === "loading"
            ? "Loading…"
            : `Show more · ${search.items.length} of ${search.total}`}
        </button>
      )}
    </div>
  );
}
