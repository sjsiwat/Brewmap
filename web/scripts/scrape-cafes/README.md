# Café data pipeline — real Chiang Mai data

`lib/cafes.ts` now contains **173 real cafés** sourced from Google Maps instead
of fictional seed data. This folder documents/reproduces how that happened,
in two rounds:

- **Round 1 (60 cafés)** — `build_cafes.py` + `raw-top60.json` + `enriched-output.json`
- **Round 2 (+113 cafés → 173 total)** — `build_cafes_full.py` + `raw-full173.json` +
  `enriched-output-full173.json`, which reuses round 1's `ENRICH`/overrides from
  `build_cafes.py` and adds `enrich2.py` on top for the new 113.

`lib/cafes.ts` is currently built from **round 2's output** (173 cafés). Round 1's
files are kept for history/diffing — you don't need to re-run them separately.

## Pipeline

```
1. scrape      gosom/google-maps-scraper (Docker) → raw Google Maps listings
2. filter      keep cafe-ish categories, review_count >= 15, score-ranked
               (rating * log(review_count)), across multiple CM districts
3. enrich      AI-read each café's real review text → specialty / flavor /
               atmosphere / tags / petFriendly / parking / drinkType / price
4. build       build_cafes_full.py → TypeScript array matching the `Cafe` interface
```

**What's real vs. AI-derived:**

| Field | Source |
|---|---|
| name, address, lat/lng, hours, rating, reviewCount | Real Google Maps listing data |
| specialty, flavor, atmosphere, tags, petFriendly, parking, drinkType, price | AI-derived from real customer review text (Google doesn't expose these as structured fields) — **treat as a seed to verify with café owners / manual QA before production use** |

## Re-running the scrape

```bash
docker pull gosom/google-maps-scraper

mkdir -p out
docker run --rm \
  -v gmaps-playwright-cache:/opt \
  -v "$PWD/queries-batch1.txt:/queries.txt:ro" \
  -v "$PWD/out:/out" \
  gosom/google-maps-scraper \
  -input /queries.txt -results /out/cafes.json -json -depth 1 \
  -exit-on-inactivity 2m
```

Repeat with `queries-batch2.txt` (or new query files of your own, covering
more districts/intents) to get more raw listings, then merge + dedupe the
JSON-lines outputs by `place_id`, filter (category + `review_count >= 15`),
and rank by `rating * log(review_count)` before enriching — see the scoring
logic at the top of `build_cafes_full.py`.

## Files

- `queries-batch1.txt` / `queries-batch2.txt` — the search queries used (Nimman, Old City,
  Santitham, Chang Phueak, Doi Suthep, Hang Dong, Wat Ket, Fa Ham, matcha/roastery/
  pet-friendly/work-friendly intents, etc.)
- `raw-top60.json` / `raw-full173.json` — the raw scraped listings selected for
  enrichment, including the real review text each café's AI-derived fields came
  from (useful if you want to re-enrich with a different model/prompt later)
- `build_cafes.py` — round 1: filters/scores/transforms raw listings + a hardcoded
  `ENRICH` dict into the first 60 cafés. Still imported by `build_cafes_full.py`.
- `enrich2.py` — round 2's additions: `ENRICH2` (cafés #61–173), plus
  `NAME_OVERRIDE2` / `ADDRESS_OVERRIDE2` / `SLUG_OVERRIDE2` for cleaning up
  Thai-script names, inconsistent Google admin-area data, and duplicate slugs
  (e.g. two different "Stan's Cafe" locations).
- `build_cafes_full.py` — merges round 1 + round 2's enrichment dicts, maps raw
  Google admin areas to friendly district labels, computes real haversine
  distance from a Tha Phae Gate reference point, formats hours to 24h, and
  writes the final `Cafe[]` shape. Run with `python3 build_cafes_full.py`
  from this directory — writes `enriched-output-full173.json`.
- `enriched-output-full173.json` — the exact 173-café dataset currently pasted
  into `lib/cafes.ts`.

## Scaling up further

To add more cafés beyond 173: scrape more districts/queries, raise the
candidate pool filter in `build_cafes_full.py`, and add new entries to
`ENRICH2` (or a new `enrich3.py`) per new café — read its `review_snippets`
and write specialty/flavor/atmosphere/tags by hand, or hand the raw JSON to
an LLM to do it (that's how both rounds here were produced). At real scale
this enrichment step should move into its own LLM pipeline (e.g. call the
Claude API per café in a loop) rather than a hardcoded dict.

## ⚠️ Legal note

`google-maps-scraper`'s own README states scraping Google Maps may violate
its Terms of Service — this is fine for a class prototype/portfolio project
but should be swapped for the official **Google Places API** (or a licensed
data provider) before any commercial/production use.
