"""
Round 3: merge the city-wide scrape (out/*.json, JSON lines from
gosom/google-maps-scraper) into raw-all.json, after the 173 cafés of rounds
1-2 and in the same shape the server's import scripts read.

  python3 build_raw_all.py out/batch3.json [more.json ...]

Keeps a scraped place only if it is a café (by Google category), inside
Chiang Mai province, has 15+ reviews, and isn't already in the list (same
place_id or cid). New cafés are ordered best first by rating * log(reviews),
as in rounds 1-2, so their index ("174", "175", ...) follows on.

Every review keeps only rating, text, language and date. Reviewer names,
photos, profile links, review ids and owner replies are dropped here, before
anything is written.
"""
import json, math, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
OLD = os.path.join(HERE, 'raw-full173.json')
OUT = os.path.join(HERE, 'raw-all.json')

CAFE_CATEGORIES = {
    'cafe', 'coffee shop', 'coffee roasters', 'espresso bar', 'coffee store',
    'tea house', 'cat cafe', 'dog cafe', 'dessert shop', 'bakery',
}
# A bakery or dessert shop counts only when Google also calls it a café.
NEEDS_CAFE_TOO = {'dessert shop', 'bakery'}
MIN_REVIEWS = 15
# Chiang Mai province, generously; the address check below does the rest.
LAT = (17.2, 20.2)
LNG = (98.0, 99.7)

REVIEW_KEYS = ('Rating', 'Description', 'text_original', 'text_translated', 'language', 'published_at')
PLACE_KEYS = (
    'title', 'place_id', 'cid', 'category', 'categories', 'address', 'complete_address',
    'latitude', 'longitude', 'open_hours', 'review_count', 'review_rating',
)


def is_cafe(place):
    cats = {c.lower() for c in (place.get('categories') or [place.get('category') or ''])}
    hits = cats & CAFE_CATEGORIES
    if not hits:
        return False
    return bool(hits - NEEDS_CAFE_TOO)


def in_chiang_mai(place):
    lat, lng = place.get('latitude'), place.get('longitude')
    if lat is None or lng is None or not (LAT[0] <= lat <= LAT[1] and LNG[0] <= lng <= LNG[1]):
        return False
    ca = place.get('complete_address') or {}
    text = ' '.join([place.get('address') or '', ca.get('state') or '', ca.get('postal_code') or ''])
    return 'Chiang Mai' in text or 'เชียงใหม่' in text or (ca.get('postal_code') or '').startswith('50')


def slim(place):
    out = {k: place.get(k) for k in PLACE_KEYS}
    out['user_reviews'] = [
        {k: r.get(k) for k in REVIEW_KEYS if r.get(k) not in (None, '')}
        for r in (place.get('user_reviews') or [])
    ]
    return out


def score(place):
    return place['review_rating'] * math.log(place['review_count'])


def main(paths):
    old = json.load(open(OLD))
    seen = {p.get('place_id') for p in old} | {p.get('cid') for p in old}
    seen.discard(None)

    found, skipped = {}, {'not a café': 0, 'outside Chiang Mai': 0, 'few reviews': 0, 'already listed': 0}
    for path in paths:
        for line in open(path):
            if not line.strip():
                continue
            place = json.loads(line)
            key = place.get('place_id') or place.get('cid')
            if not key or key in found:
                continue
            if key in seen or place.get('cid') in seen:
                skipped['already listed'] += 1
            elif not is_cafe(place):
                skipped['not a café'] += 1
            elif not in_chiang_mai(place):
                skipped['outside Chiang Mai'] += 1
            elif (place.get('review_count') or 0) < MIN_REVIEWS or not place.get('review_rating'):
                skipped['few reviews'] += 1
            else:
                found[key] = place
                continue
            # Count each place once, however many queries found it.
            found.setdefault(key, None)

    new = sorted((p for p in found.values() if p), key=score, reverse=True)
    rows = [slim(p) for p in old] + [slim(p) for p in new]
    json.dump(rows, open(OUT, 'w'), ensure_ascii=False, indent=1)
    print(f'{len(old)} existing + {len(new)} new = {len(rows)} cafés -> {os.path.basename(OUT)}')
    print('skipped:', ', '.join(f'{k} {v}' for k, v in skipped.items()))


if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    main(sys.argv[1:])
