"""
Owner picks: add a place the city-wide scrape missed or filtered out (e.g. a
bakery Google doesn't also call a café) to the END of raw-all.json, so every
existing café keeps its index. Its Thai title goes into names-th.json.

  python3 add_places.py out/place.json out/place-th.json

The first file is the scrape with Google in English, the second with -lang th
(both JSON lines from gosom/google-maps-scraper). Chiang Mai, covered-area and
15+ review checks still apply; only the café-category check is skipped. Reviews
are slimmed exactly as in build_raw_all.py (no reviewer data).
Then: npm run ai:enrich, python3 build_cafes_all.py, and the server imports.
"""
import json, os, sys

from build_raw_all import MIN_REVIEWS, in_chiang_mai, in_covered_area, slim

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, 'raw-all.json')
NAMES = os.path.join(HERE, 'names-th.json')


def lines(path):
    return [json.loads(l) for l in open(path) if l.strip()]


def main(en_path, th_path):
    raw = json.load(open(RAW))
    names = json.load(open(NAMES))
    seen = {p.get('place_id') for p in raw} | {p.get('cid') for p in raw}
    thai = {p.get('place_id'): p['title'].strip() for p in lines(th_path) if p.get('title')}
    added = []
    for place in lines(en_path):
        pid = place.get('place_id')
        if not pid or pid in seen or place.get('cid') in seen:
            print(f'skip {place.get("title")}: already listed')
            continue
        if not in_chiang_mai(place) or not in_covered_area(place):
            print(f'skip {place.get("title")}: outside the covered area')
            continue
        if (place.get('review_count') or 0) < MIN_REVIEWS or not place.get('review_rating'):
            print(f'skip {place.get("title")}: fewer than {MIN_REVIEWS} reviews')
            continue
        raw.append(slim(place))
        seen.add(pid)
        if thai.get(pid):
            names[pid] = thai[pid]
        added.append(f'#{len(raw):03d} {place["title"]}')
    json.dump(raw, open(RAW, 'w'), ensure_ascii=False, indent=1)
    json.dump(names, open(NAMES, 'w'), ensure_ascii=False, indent=1, sort_keys=True)
    open(NAMES, 'a').write('\n')
    print('added:', ', '.join(added) or 'nothing')


if __name__ == '__main__':
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2])
