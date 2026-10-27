"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, MapPin, Sparkles, Star } from "lucide-react";
import * as api from "@/lib/api";
import type { AiFilters, AiFindResult } from "@/lib/api";
import { formatPrice } from "@/lib/cafes";
import { formatKm } from "@/lib/geo";
import { useUserLocation } from "@/lib/use-user-location";
import { FavoriteButton } from "@/components/favorite-button";

const QUERY_MIN = 3;
const QUERY_MAX = 300;

const EXAMPLES = [
  "ร้านเงียบ ๆ นั่งทำงานได้ มีที่จอดรถ",
  "Matcha under 150 baht",
  "คาเฟ่ใกล้ฉันที่พาหมาไปได้",
];

/** Human-readable chips for the filters the AI applied. */
function describeFilters(filters: AiFilters): string[] {
  const chips: string[] = [];
  if (filters.drinkType) chips.push(filters.drinkType);
  if (filters.tag) chips.push(filters.tag);
  if (filters.area) chips.push(filters.area);
  if (filters.minPrice !== undefined && filters.maxPrice !== undefined) {
    chips.push(`${filters.minPrice}–${filters.maxPrice}฿`);
  } else if (filters.maxPrice !== undefined) {
    chips.push(`≤ ${filters.maxPrice}฿`);
  } else if (filters.minPrice !== undefined) {
    chips.push(`≥ ${filters.minPrice}฿`);
  }
  if (filters.parking) chips.push("Parking");
  if (filters.petFriendly) chips.push("Pet friendly");
  if (filters.radiusKm !== undefined) chips.push(`Within ${filters.radiusKm} km`);
  if (filters.sort && filters.sort !== "rating") chips.push(`By ${filters.sort}`);
  return chips;
}

function errorText(error: unknown): string {
  if (!(error instanceof api.ApiError)) return "Something went wrong. Try again.";
  if (error.status === 0) return "Can't reach BrewMap right now. Try again in a moment.";
  if (error.status === 429) return "That's a lot of questions — wait a minute, then ask again.";
  if (error.status === 503) return "The AI Finder is taking a break. Use the filters below instead.";
  if (error.status === 400) return `Describe what you want in ${QUERY_MIN}–${QUERY_MAX} characters.`;
  return "Something went wrong on our side. Try again in a moment.";
}

/** Ask in plain Thai or English; shows up to 5 cafés and why each fits. */
export function AiFinder() {
  const { origin } = useUserLocation();
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<AiFindResult | null>(null);
  const [asked, setAsked] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Ignore answers to an older question if a newer one was sent meanwhile.
  const latest = useRef(0);

  async function ask(text: string) {
    const trimmed = text.trim();
    if (trimmed.length < QUERY_MIN) {
      setError(`Describe what you want in ${QUERY_MIN}–${QUERY_MAX} characters.`);
      return;
    }
    const id = ++latest.current;
    setLoading(true);
    setError(null);
    try {
      const answer = await api.aiFind({ query: trimmed, lat: origin.lat, lng: origin.lng });
      if (id !== latest.current) return;
      setResult(answer);
      setAsked(trimmed);
    } catch (err) {
      if (id !== latest.current) return;
      setError(errorText(err));
    } finally {
      if (id === latest.current) setLoading(false);
    }
  }

  const chips = result ? describeFilters(result.filters) : [];
  const dropped = result ? describeFilters(result.relaxed ?? {}) : [];

  return (
    <section aria-labelledby="ai-finder-heading" className="border border-ink">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void ask(query);
        }}
        className="p-5 md:p-6"
      >
        <label htmlFor="ai-query" className="flex items-center gap-2">
          <Sparkles size={14} className="text-rust" aria-hidden />
          <span id="ai-finder-heading" className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-rust">
            Ask BrewMap · Thai or English
          </span>
        </label>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input
            id="ai-query"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            maxLength={QUERY_MAX}
            placeholder="e.g. a quiet café with creamy latte and parking"
            className="min-w-0 flex-1 border-0 border-b border-ink bg-transparent px-0 py-2 font-display text-xl text-ink placeholder:font-sans placeholder:text-base placeholder:text-muted focus:border-rust focus:outline-none focus:ring-0"
          />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 bg-ink px-6 py-3 font-mono text-xs uppercase tracking-[0.12em] text-paper transition-colors hover:bg-rust disabled:cursor-wait disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-rust"
          >
            {loading ? "Thinking…" : "Find cafés"}
            <ArrowUpRight size={14} aria-hidden />
          </button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              disabled={loading}
              onClick={() => {
                setQuery(example);
                void ask(example);
              }}
              className="border border-line px-3 py-1.5 text-xs text-ink-soft transition-colors hover:border-rust hover:text-rust disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rust"
            >
              {example}
            </button>
          ))}
        </div>
      </form>

      <div aria-live="polite">
        {error && (
          <p role="alert" className="border-t border-line px-5 py-4 text-sm text-rust md:px-6">
            {error}
          </p>
        )}

        {result && !error && (
          <div className="border-t border-ink">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-5 pt-4 md:px-6">
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.1em] text-muted">
                {result.items.length === 0
                  ? "No café matches"
                  : `Top ${result.items.length} for “${asked}”`}
              </span>
              {chips.map((chip) => (
                <span key={chip} className="bg-rust-soft px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-[0.08em] text-ink">
                  {chip}
                </span>
              ))}
            </div>

            {dropped.length > 0 && result.items.length > 0 && (
              <p className="px-5 pt-3 text-sm text-ink-soft md:px-6">
                Nothing matched everything, so these skip:{" "}
                <span className="text-ink">{dropped.join(", ")}</span>.
              </p>
            )}

            {result.items.length === 0 ? (
              <p className="px-5 pt-3 pb-5 text-sm text-ink-soft md:px-6">
                Try asking more broadly, or use the filters below.
              </p>
            ) : (
              <ol className="mt-3">
                {result.items.map(({ cafe, reason }, i) => (
                  <li key={cafe.slug} className="relative border-t border-line">
                    <Link
                      href={`/cafes/${cafe.slug}`}
                      className="group grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 px-5 py-5 pr-12 md:px-6 md:pr-14"
                    >
                      <span className="font-mono text-sm text-muted">{String(i + 1).padStart(2, "0")}</span>
                      <div>
                        <h3 className="font-display text-xl text-ink transition-colors group-hover:text-rust">
                          {cafe.name}
                        </h3>
                        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                          <span className="inline-flex items-center gap-1">
                            <MapPin size={12} aria-hidden />
                            {cafe.area}
                            {cafe.distanceKm !== undefined && ` · ${formatKm(cafe.distanceKm)}`}
                          </span>
                          <span className="inline-flex items-center gap-1 text-ink">
                            <Star size={11} className="fill-current text-rust" aria-hidden />
                            {cafe.rating.toFixed(1)}
                          </span>
                          <span className="text-rust">{formatPrice(cafe.priceAvg)}</span>
                        </p>
                        {reason && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">{reason}</p>}
                      </div>
                    </Link>
                    <FavoriteButton cafe={cafe} className="absolute top-5 right-4 p-1 md:right-5" />
                  </li>
                ))}
              </ol>
            )}
            <p className="border-t border-line px-5 py-3 text-[0.7rem] leading-relaxed text-muted md:px-6">
              Picked by AI from BrewMap&apos;s café data — double-check hours and prices before you go.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
