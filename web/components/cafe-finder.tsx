"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, LocateFixed, MapPin, RotateCw, Search, Sparkles } from "lucide-react";
import * as api from "@/lib/api";
import type { CafeSort } from "@/lib/api";
import {
  activeFilterCount,
  filterLabels,
  fromAiFilters,
  patchFilters,
  referencePlaces,
  type FinderFilters,
  type ReferencePlace,
} from "@/lib/finder-filters";
import { format, plural } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/client";
import type { Dictionary } from "@/lib/i18n/en";
import { useCafeSearch } from "@/lib/use-cafe-search";
import { requestUserLocation, useUserLocation } from "@/lib/use-user-location";
import { CafeCard } from "@/components/cafe-card";
import { FilterChips } from "@/components/filter-chips";
import { Reveal } from "@/components/reveal";

const sortOptions: CafeSort[] = ["recommended", "distance", "price", "rating"];
const placeOptions: ReferencePlace[] = ["device", "nimman", "oldCity"];

const PAGE_SIZE = 24;
/** Mirrors SEARCH_MAX in server/src/cafes/dto/query-cafes.dto.ts. */
const NAME_MAX = 60;
/** Mirrors the AI finder's limits in server/src/ai/dto/ai.dto.ts. */
const QUERY_MIN = 3;
const QUERY_MAX = 300;
/** Wait for a pause in typing before searching, so each keystroke isn't a request. */
const NAME_DEBOUNCE_MS = 300;

const normalise = (text: string) => text.trim().replace(/\s+/g, " ");

function aiErrorText(error: unknown, t: Dictionary["finder"]["aiErrors"]): string {
  if (!(error instanceof api.ApiError)) return t.generic;
  if (error.status === 0) return t.offline;
  if (error.status === 429) return t.rateLimited;
  if (error.status === 503) return t.unavailable;
  if (error.status === 400) return format(t.length, { min: QUERY_MIN, max: QUERY_MAX });
  return t.server;
}

/** What the AI made of the last question, shown under the search box. */
interface AiAnswer {
  asked: string;
  /** Filters it had to drop because nothing matched them all. */
  skipped: string[];
  /** Why each café it picked fits, by slug. */
  reasons: Record<string, string>;
}

/**
 * A search typed in the header on another page arrives as /cafes?search=…:
 * run it once, then drop it from the address so a reload doesn't ask the AI again.
 */
function SearchFromUrl({ onSearch }: { onSearch: (search: string) => void }) {
  const search = useSearchParams().get("search")?.trim();
  const router = useRouter();
  const { href } = useI18n();
  const handled = useRef(false);
  useEffect(() => {
    if (!search || handled.current) return;
    handled.current = true;
    onSearch(search.slice(0, QUERY_MAX));
    router.replace(href("/cafes"), { scroll: false });
  }, [search, onSearch, router, href]);
  return null;
}

/**
 * The café search: one box for a café name or a sentence for the AI, filter
 * chips that both share, and the list. Everything applies as soon as it changes.
 */
export function CafeFinder() {
  const { lang, t: dict } = useI18n();
  const t = dict.finder;
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [filters, setFilters] = useState<FinderFilters>({});
  const [sort, setSort] = useState<CafeSort>("recommended");
  const [answer, setAnswer] = useState<AiAnswer | null>(null);
  const [asking, setAsking] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  // Ignore answers to an older question if a newer one was sent meanwhile.
  const latestAsk = useRef(0);

  const { origin: deviceOrigin, status: locationStatus } = useUserLocation();
  // null until the visitor picks: then it follows whether location is allowed.
  const [chosenPlace, setChosenPlace] = useState<ReferencePlace | null>(null);
  const place: ReferencePlace = chosenPlace ?? (locationStatus === "device" ? "device" : "oldCity");
  const usingDevice = place === "device" && locationStatus === "device";
  const origin = usingDevice ? deviceOrigin : referencePlaces[place === "nimman" ? "nimman" : "oldCity"];
  const locationOff = locationStatus === "denied" || locationStatus === "unsupported";

  // A café name searches as you type (after a short pause). The sentence the
  // AI just answered isn't a name, so it doesn't search names again.
  useEffect(() => {
    const timer = setTimeout(() => {
      const typed = normalise(text);
      setName(typed.length <= NAME_MAX && typed !== answer?.asked ? typed : "");
    }, NAME_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [text, answer?.asked]);

  const search = useCafeSearch({
    ...filters,
    q: name || filters.q,
    lat: origin.lat,
    lng: origin.lng,
    sort,
    limit: PAGE_SIZE,
    lang,
  });

  const activeCount = activeFilterCount(filters);
  const sortLabel = t.sorts[sort];
  const placeLabel = (option: ReferencePlace) => (option === "device" ? t.yourLocation : dict.places[option]);
  const noNameMatch = !!name && search.status === "ready" && search.total === 0;

  async function ask(question: string) {
    if (question.length < QUERY_MIN) {
      setAiError(format(t.aiErrors.length, { min: QUERY_MIN, max: QUERY_MAX }));
      return;
    }
    const id = ++latestAsk.current;
    setAsking(true);
    setAiError(null);
    try {
      const result = await api.aiFind({ query: question, lat: origin.lat, lng: origin.lng });
      if (id !== latestAsk.current) return;
      setName("");
      setFilters(fromAiFilters(result.filters));
      // Without a sort of its own the AI picks the nearest matches, so list them that way too.
      setSort(result.filters.sort ?? "distance");
      setAnswer({
        asked: question,
        skipped: filterLabels(fromAiFilters(result.relaxed ?? {}), dict),
        reasons: Object.fromEntries(
          result.items.flatMap(({ cafe, reason }) => (reason ? [[cafe.slug, reason]] : [])),
        ),
      });
    } catch (error) {
      if (id !== latestAsk.current) return;
      setAiError(aiErrorText(error, t.aiErrors));
    } finally {
      if (id === latestAsk.current) setAsking(false);
    }
  }

  /** Enter: a café name if one matches, otherwise ask the AI. "Ask AI" always asks. */
  async function submit(forceAi: boolean, typed = text) {
    const question = normalise(typed);
    if (!question) {
      setAiError(t.emptyQuestion);
      return;
    }
    if (!forceAi && question.length <= NAME_MAX) {
      setName(question);
      setAiError(null);
      try {
        if ((await api.getCafes({ q: question, limit: 1 })).total > 0) return;
      } catch {
        // Can't tell: let the AI try.
      }
    }
    await ask(question);
  }

  function choosePlace(next: ReferencePlace) {
    setChosenPlace(next);
    if (next === "device" && locationStatus !== "device") requestUserLocation();
  }

  return (
    <div>
      <Suspense fallback={null}>
        <SearchFromUrl
          onSearch={(search) => {
            setText(search);
            void submit(false, search);
          }}
        />
      </Suspense>

      {/* Pinned under the header (h-16) while the list scrolls. */}
      <div className="sticky top-16 z-40 -mx-6 bg-paper px-6 py-2 md:-mx-10 md:px-10 md:py-3">
        <form
          role="search"
          // The button always asks the AI; Enter in the box is handled below.
          onSubmit={(event) => {
            event.preventDefault();
            void submit(true);
          }}
          className="flex items-center gap-2 border border-ink bg-paper-raised p-1.5 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-rust md:p-2"
        >
          <div className="flex min-w-0 flex-1 items-center gap-3 pl-2 md:px-3">
            <Search size={16} className="shrink-0 text-muted" aria-hidden />
            <label htmlFor="cafe-search" className="sr-only">
              {t.searchLabel}
            </label>
            <input
              id="cafe-search"
              type="search"
              value={text}
              onChange={(event) => {
                setText(event.target.value);
                // A new search: the AI's note and reasons were about the old question.
                if (answer && normalise(event.target.value) !== answer.asked) setAnswer(null);
              }}
              onKeyDown={(event) => {
                if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
                event.preventDefault();
                void submit(false);
              }}
              maxLength={QUERY_MAX}
              autoComplete="off"
              spellCheck={false}
              enterKeyHint="search"
              placeholder={t.searchPlaceholder}
              className="w-full min-w-0 border-0 bg-transparent py-2.5 font-sans text-base text-ink placeholder:text-muted focus:outline-none focus:ring-0"
            />
          </div>
          <button
            type="submit"
            disabled={asking}
            aria-label={asking ? t.asking : t.askAi}
            className="inline-flex shrink-0 items-center justify-center gap-2 bg-ink px-3.5 py-3 font-mono text-xs uppercase tracking-[0.12em] text-paper transition-colors hover:bg-rust disabled:cursor-wait disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rust"
          >
            <Sparkles size={14} aria-hidden />
            <span className="max-sm:hidden">{asking ? t.thinking : t.askAi}</span>
          </button>
        </form>
      </div>

      <div aria-live="polite" className="min-h-6 text-sm">
        {asking ? (
          <p className="text-muted">{format(t.reading, { q: normalise(text) })}</p>
        ) : aiError ? (
          <p role="alert" className="text-rust">
            {aiError}
          </p>
        ) : noNameMatch ? (
          <p className="text-ink-soft">{format(t.noNameMatch, { name })}</p>
        ) : answer ? (
          <p className="flex flex-wrap items-baseline gap-x-1.5 text-ink-soft">
            <Sparkles size={13} className="self-center text-rust" aria-hidden />
            {format(t.aiUnderstood, { q: answer.asked })}
            {answer.skipped.length > 0 && <span>{format(t.aiSkipped, { list: answer.skipped.join(", ") })}</span>}
          </p>
        ) : (
          <div className="-mx-6 flex items-center gap-2 overflow-x-auto px-6 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0">
            <span className="shrink-0 text-muted">{t.tryLabel}</span>
            {t.examples.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => {
                  setText(example);
                  void ask(example);
                }}
                className="shrink-0 border border-line px-3 py-1.5 text-xs text-ink-soft transition-colors hover:border-rust hover:text-rust focus-ring"
              >
                {example}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-3 md:mt-5">
        <FilterChips
          filters={filters}
          onChange={(patch) => {
            if (patch === null) setAnswer(null);
            setFilters((prev) => (patch === null ? {} : patchFilters(prev, patch)));
          }}
        />
      </div>

      <div className="mt-5 flex items-end justify-between gap-x-6 gap-y-3 border-b border-ink pb-3 md:mt-8 md:pb-4">
        <div>
          <p className="text-sm text-ink" aria-live="polite">
            {search.total === null ? (
              search.status === "error" ? (
                t.loadFailed
              ) : (
                t.loading
              )
            ) : (
              <>
                <span className="font-display text-2xl">{search.total}</span>{" "}
                {plural(t.count, search.total)}
                {name ? format(t.named, { name }) : ""}
                {activeCount > 0 ? t.matchingAll : ""}
                <span className="sr-only">{format(t.sortedBy, { sort: sortLabel })}</span>
              </>
            )}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-1.5 text-sm text-ink-soft">
            <span>{t.distancesFrom}</span>
            <label className="relative inline-flex items-center gap-1 text-ink focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-rust">
              <MapPin size={13} className="text-rust" aria-hidden />
              <span className="underline decoration-line underline-offset-4" aria-hidden>
                {placeLabel(place)}
              </span>
              <ChevronDown size={13} className="text-muted" aria-hidden />
              <select
                value={place}
                onChange={(event) => choosePlace(event.target.value as ReferencePlace)}
                aria-label={t.distanceFromLabel}
                className="absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0"
              >
                {placeOptions.map((option) => (
                  <option key={option} value={option}>
                    {placeLabel(option)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
        <label className="relative flex shrink-0 items-center gap-2 border border-line bg-paper-raised py-2 pr-3 pl-3 md:pl-4 focus-within:outline focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-rust">
          <span className="label-mono max-sm:sr-only">{t.sort}</span>
          <span className="pointer-events-none flex items-center gap-1.5 text-sm text-ink" aria-hidden>
            {sortLabel}
            <ChevronDown size={13} className="text-muted" />
          </span>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as CafeSort)}
            aria-label={t.sortLabel}
            className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent opacity-0"
          >
            {sortOptions.map((option) => (
              <option key={option} value={option}>
                {t.sorts[option]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {place === "device" && !usingDevice && (
        <p role="status" className="mt-3 flex gap-2 text-xs text-ink-soft md:text-sm">
          <LocateFixed size={14} className="mt-0.5 shrink-0 text-rust" aria-hidden />
          {locationStatus === "locating" ? t.locating : locationOff ? t.locationOffChosen : t.locationNotShared}
        </p>
      )}
      {chosenPlace === null && !usingDevice && locationStatus !== "locating" && (
        <p role="status" className="mt-3 flex gap-2 text-xs text-ink-soft md:text-sm">
          <LocateFixed size={14} className="mt-0.5 shrink-0 text-rust" aria-hidden />
          <span>
            {locationOff ? t.locationOff : t.locationDefault}{" "}
            <button
              type="button"
              onClick={() => choosePlace("device")}
              className="text-rust underline-offset-4 hover:underline focus-ring"
            >
              {t.useMyLocation}
            </button>
          </span>
        </p>
      )}

      <div>
        {search.items.length > 0 && (
          <ul className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {search.items.map((cafe, i) => (
              <Reveal as="li" key={cafe.slug} delay={Math.min((i % PAGE_SIZE) * 0.03, 0.3)}>
                <CafeCard cafe={cafe} reason={answer?.reasons[cafe.slug]} />
              </Reveal>
            ))}
          </ul>
        )}

        {search.status === "ready" && search.items.length === 0 && (
          <p className="border-b border-line py-10 text-sm text-muted">
            {name ? format(activeCount > 0 ? t.noNamedFiltered : t.noNamed, { name }) : t.noMatch}
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
              <p className="font-display text-lg text-ink">{t.loadFailedTitle}</p>
              <p className="mt-1 text-sm text-muted">
                {search.error?.status === 0
                  ? t.apiDown
                  : search.error?.message}
              </p>
            </div>
            <button
              type="button"
              onClick={search.retry}
              className="inline-flex items-center gap-2 self-start border border-ink px-4 py-2 font-mono text-xs uppercase tracking-[0.1em] text-ink transition-colors hover:bg-ink hover:text-paper focus-ring"
            >
              <RotateCw size={14} aria-hidden />
              {t.tryAgain}
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
            ? t.loadingMore
            : format(t.showMore, { shown: search.items.length, total: search.total ?? 0 })}
        </button>
      )}
    </div>
  );
}
