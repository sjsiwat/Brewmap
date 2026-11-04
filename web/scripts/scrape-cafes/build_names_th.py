"""
Thai names (Phase 18): the same queries scraped again with Google set to Thai
(-lang th) give each place its Thai title, e.g. "Banta Coffee" is
"ร้านกาแฟบ้านตา". Matched to raw-all.json by place_id (or cid) and written to
names-th.json; build_cafes_all.py turns them into each café's `nameTh`.

  python3 build_names_th.py out/names-th.json [more.json ...]

Only the title is kept from the Thai scrape.
"""
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'names-th.json')


def main(paths):
    raw = json.load(open(os.path.join(HERE, 'raw-all.json')))
    titles = {}
    for path in paths:
        for line in open(path):
            if not line.strip():
                continue
            place = json.loads(line)
            for key in (place.get('place_id'), place.get('cid')):
                if key and place.get('title'):
                    titles.setdefault(key, place['title'].strip())
    names = {}
    for place in raw:
        title = titles.get(place.get('place_id')) or titles.get(place.get('cid'))
        if title:
            names[place['place_id']] = title
    json.dump(names, open(OUT, 'w'), ensure_ascii=False, indent=1, sort_keys=True)
    open(OUT, 'a').write('\n')
    print(f'Thai titles for {len(names)} of {len(raw)} cafés -> {os.path.basename(OUT)}')


if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    main(sys.argv[1:])
