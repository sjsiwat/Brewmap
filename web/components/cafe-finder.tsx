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
import { useCafeSearch } from "@/lib/use-cafe-search";
import { requestUserLocation, useUserLocation } from "@/lib/use-user-location";
import { CafeCard } from "@/components/cafe-card";
import { FilterChips } from "@/components/filter-chips";
import { Reveal } from "@/components/reveal";

const sortOptions: Array<{ value: CafeSort; label: string }> = [
  { value: "recommended", label: "Recommended" },
  { value: "distance", label: "Nearest" },
  { value: "price", label: "Cheapest" },
  { value: "rating", label: "Top rated" },
];

const placeOptions: Array<{ value: ReferencePlace; label: string }> = [
  { value: "device", label: "Your location" },
  { value: "nimman", label: referencePlaces.nimman.label },
  { value: "oldCity", label: referencePlaces.oldCity.label },
];

const PAGE_SIZE = 24;
/** Mirrors SEARCH_MAX in server/src/cafes/dto/query-cafes.dto.ts. */
const NAME_MAX = 60;
/** Mirrors the AI finder's limits in server/src/ai/dto/ai.dto.ts. */
const QUERY_MIN = 3;
const QUERY_MAX = 300;
/** Wait for a pause in typing before searching, so each keystroke isn't a request. */
const NAME_DEBOUNCE_MS = 300;

const EXAMPLES = [
  "ร้านเงียบ ๆ นั่งทำงานได้ มีที่จอดรถ",
  "Matcha under 150 baht",
  "คาเฟ่ใกล้ฉันที่พาหมาไปได้",
];

const normalise = (text: string) => text.trim().replace(/\s+/g, " ");

function aiErrorText(error: unknown): string {
  if (!(error instanceof api.ApiError)) return "Something went wrong. Try again.";
  if (error.status === 0) return "Can't reach BrewMap right now. Try again in a moment.";
  if (error.status === 429) return "That's a lot of questions — wait a minute, then ask again.";
  if (error.status === 503) return "The AI is taking a break. Use the filters instead.";
  if (error.status === 400) return `Describe what you want in ${QUERY_MIN}–${QUERY_MAX} characters.`;
  return "Something went wrong on our side. Try again in a moment.";
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
  const handled = useRef(false);
  useEffect(() => {
    if (!search || handled.current) return;
    handled.current = true;
    onSearch(search.slice(0, QUERY_MAX));
    router.replace("/cafes", { scroll: false });
  }, [search, onSearch, router]);
  return null;
}

/**
 * The café search: one box for a café name or a sentence for the AI, filter
 * chips that both share, and the list. Everything applies as soon as it changes.
 */
export function CafeFinder() {
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
  const origin = usingDevice ? deviceOrigin : referencePlaces[place === "nimman" ? "nimman" : "oldCity"].at;
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
  });

  const activeCount = activeFilterCount(filters);
  const sortLabel = sortOptions.find((option) => option.value === sort)?.label ?? "";
  const noNameMatch = !!name && search.status === "ready" && search.total === 0;

  async function ask(question: string) {
    if (question.length < QUERY_MIN) {
      setAiError(`Describe what you want in ${QUERY_MIN}–${QUERY_MAX} characters.`);
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
        skipped: filterLabels(fromAiFilters(result.relaxed ?? {})),
        reasons: Object.fromEntries(
          result.items.flatMap(({ cafe, reason }) => (reason ? [[cafe.slug, reason]] : [])),
        ),
      });
    } catch (error) {
      if (id !== latestAsk.current) return;
      setAiError(aiErrorText(error));
    } finally {
      if (id === latestAsk.current) setAsking(false);
    }
  }

  /** Enter: a café name if one matches, otherwise ask the AI. "Ask AI" always asks. */
  async function submit(forceAi: boolean, typed = text) {
    const question = normalise(typed);
    if (!question) {
      setAiError("Type a café name, or describe the café you want.");
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
              Search by café name, or describe the café you want
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
              placeholder="Café name, or what you feel like"
              className="w-full min-w-0 border-0 bg-transparent py-2.5 font-sans text-base text-ink placeholder:text-muted focus:outline-none focus:ring-0"
            />
          </div>
          <button
            type="submit"
            disabled={asking}
            aria-label={asking ? "Asking the AI" : "Ask AI"}
            className="inline-flex shrink-0 items-center justify-center gap-2 bg-ink px-3.5 py-3 font-mono text-xs uppercase tracking-[0.12em] text-paper transition-colors hover:bg-rust disabled:cursor-wait disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rust"
          >
            <Sparkles size={14} aria-hidden />
            <span className="max-sm:hidden">{asking ? "Thinking…" : "Ask AI"}</span>
          </button>
        </form>
      </div>

      <div aria-live="polite" className="min-h-6 text-sm">
        {asking ? (
          <p className="text-muted">Reading “{normalise(text)}”…</p>
        ) : aiError ? (
          <p role="alert" className="text-rust">
            {aiError}
          </p>
        ) : noNameMatch ? (
          <p className="text-ink-soft">
            No café named “{name}”. Press Enter or <span className="text-ink">Ask AI</span> to search by what
            you&apos;re after instead.
          </p>
        ) : answer ? (
          <p className="flex flex-wrap items-baseline gap-x-1.5 text-ink-soft">
            <Sparkles size={13} className="self-center text-rust" aria-hidden />
            The AI turned “{answer.asked}” into the filters below — remove any you don&apos;t want.
            {answer.skipped.length > 0 && (
              <span>
                Nothing matched everything, so it skipped <span className="text-ink">{answer.skipped.join(", ")}</span>.
              </span>
            )}
          </p>
        ) : (
          <div className="-mx-6 flex items-center gap-2 overflow-x-auto px-6 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0">
            <span className="shrink-0 text-muted">Try:</span>
            {EXAMPLES.map((example) => (
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
                "Couldn't load cafés"
              ) : (
                "Loading cafés…"
              )
            ) : (
              <>
                <span className="font-display text-2xl">{search.total}</span>{" "}
                café{search.total === 1 ? "" : "s"}
                {name ? ` named “${name}”` : ""}
                {activeCount > 0 ? " matching every filter" : ""}
                <span className="sr-only"> · sorted by {sortLabel}</span>
              </>
            )}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-x-1.5 text-sm text-ink-soft">
            <span>Distances from</span>
            <label className="relative inline-flex items-center gap-1 text-ink focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-rust">
              <MapPin size={13} className="text-rust" aria-hidden />
              <span className="underline decoration-line underline-offset-4" aria-hidden>
                {placeOptions.find((option) => option.value === place)?.label}
              </span>
              <ChevronDown size={13} className="text-muted" aria-hidden />
              <select
                value={place}
                onChange={(event) => choosePlace(event.target.value as ReferencePlace)}
                aria-label="Measure distances from"
                className="absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0"
              >
                {placeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
        <label className="relative flex shrink-0 items-center gap-2 border border-line bg-paper-raised py-2 pr-3 pl-3 md:pl-4 focus-within:outline focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-rust">
          <span className="label-mono max-sm:sr-only">Sort</span>
          <span className="pointer-events-none flex items-center gap-1.5 text-sm text-ink" aria-hidden>
            {sortLabel}
            <ChevronDown size={13} className="text-muted" />
          </span>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as CafeSort)}
            aria-label="Sort cafés"
            className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent opacity-0"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {place === "device" && !usingDevice && (
        <p role="status" className="mt-3 flex gap-2 text-xs text-ink-soft md:text-sm">
          <LocateFixed size={14} className="mt-0.5 shrink-0 text-rust" aria-hidden />
          {locationStatus === "locating"
            ? "Finding your location… distances are from the Old City until then."
            : locationOff
              ? "Location is off for BrewMap, so distances are from the Old City (Tha Phae Gate). Allow location in your browser to measure from where you are."
              : "Distances are from the Old City (Tha Phae Gate) until you share your location."}
        </p>
      )}
      {chosenPlace === null && !usingDevice && locationStatus !== "locating" && (
        <p role="status" className="mt-3 flex gap-2 text-xs text-ink-soft md:text-sm">
          <LocateFixed size={14} className="mt-0.5 shrink-0 text-rust" aria-hidden />
          <span>
            {locationOff
              ? "Location is off, so distances are from the Old City (Tha Phae Gate). "
              : "Distances are from the Old City (Tha Phae Gate). "}
            <button
              type="button"
              onClick={() => choosePlace("device")}
              className="text-rust underline-offset-4 hover:underline focus-ring"
            >
              Use my location
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
            {name
              ? `No café named “${name}”${activeCount > 0 ? " matches these filters" : " on BrewMap yet"}. Check the spelling${activeCount > 0 ? " or remove a filter" : ", or ask the AI"}.`
              : "No cafés match every filter — try removing one."}
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
