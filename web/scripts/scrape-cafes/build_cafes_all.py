"""
Round 3: web/data/cafes.json = the 173 cafés of rounds 1-2, unchanged, then
every round-3 café in raw-all.json that `npm run ai:enrich` has described
(enrich3.json, keyed by place_id). A café without enrichment is left out
until it has one.

  python3 build_cafes_all.py

Also writes web/data/cafe-count.json, which the site shows as its café count,
and gives every café its Thai name from names-th.json (Phase 18) as `nameTh`.
"""
import json, math, os, re, unicodedata
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, '..', '..', 'data')
CAFES = os.path.join(DATA, 'cafes.json')
COUNT = os.path.join(DATA, 'cafe-count.json')
FIRST_NEW = 173

THAI_RUN = re.compile(r"[฀-๿]+")
LATIN = re.compile(r"[A-Za-z]")

# Mueang Chiang Mai's sub-districts, as the areas rounds 1-2 already use.
MUEANG_AREAS = [
    ('Old City', ['si phum', 'phra sing', 'sri phum', 'sriphum', 'ศรีภูมิ', 'พระสิงห์']),
    ('Wualai', ['haiya', 'hai ya', 'หายยา']),
    ('Chang Moi', ['chang moi', 'ช้างม่อย']),
    ('Chang Khlan', ['chang khlan', 'ช้างคลาน']),
    ('Wat Ket', ['wat ket', 'วัดเกต']),
    ('Chang Phueak', ['chang phueak', 'chang phuak', 'changpuek', 'ช้างเผือก']),
    ('Mae Hia', ['mae hia', 'แม่เหียะ']),
    ('Pa Daet', ['pa daet', 'ป่าแดด']),
    ('Nong Hoi', ['nong hoi', 'หนองหอย']),
    ('Tha Sala', ['tha sala', 'ท่าศาลา']),
    ('Nong Pa Khrang', ['nong pa khrang', 'หนองป่าครั่ง']),
    ('Fa Ham', ['fa ham', 'ฟ้าฮ่าม']),
    ('Ping Riverside', ['pa tan', 'ป่าตัน']),
    ('San Phi Suea', ['san phi suea', 'สันผีเสื้อ']),
    ('Suthep', ['suthep', 'สุเทพ']),
]

# The other districts of Chiang Mai province: each is one area.
DISTRICTS = [
    ('Hang Dong', ['hang dong', 'หางดง']),
    ('San Sai', ['san sai', 'สันทราย']),
    ('San Kamphaeng', ['san kamphaeng', 'สันกำแพง']),
    ('Saraphi', ['saraphi', 'สารภี']),
    ('Mae Rim', ['mae rim', 'แม่ริม']),
    ('Doi Saket', ['doi saket', 'ดอยสะเก็ด']),
    ('Mae Taeng', ['mae taeng', 'แม่แตง']),
    ('Chiang Dao', ['chiang dao', 'เชียงดาว']),
    ('Samoeng', ['samoeng', 'สะเมิง']),
    ('Mae Wang', ['mae wang', 'แม่วาง']),
    ('San Pa Tong', ['san pa tong', 'สันป่าตอง']),
    ('Chom Thong', ['chom thong', 'จอมทอง']),
    ('Mae On', ['mae on', 'แม่ออน']),
    ('Doi Lo', ['doi lo', 'ดอยหล่อ']),
    ('Fang', ['fang', 'ฝาง']),
    ('Mae Ai', ['mae ai', 'แม่อาย']),
    ('Phrao', ['phrao', 'พร้าว']),
    ('Mae Chaem', ['mae chaem', 'แม่แจ่ม']),
    ('Hot', ['hot district', 'อ.ฮอด', 'อำเภอฮอด']),
    ('Doi Tao', ['doi tao', 'ดอยเต่า']),
    ('Omkoi', ['omkoi', 'อมก๋อย']),
    ('Wiang Haeng', ['wiang haeng', 'เวียงแหง']),
    ('Chai Prakan', ['chai prakan', 'ไชยปราการ']),
    ('Galyani Vadhana', ['galyani vadhana', 'กัลยาณิวัฒนา']),
]
MUEANG = ['mueang chiang mai', 'muang chiang mai', 'เมืองเชียงใหม่']


def find(rules, text):
    low = text.lower()
    for label, keys in rules:
        if any(k in low for k in keys):
            return label
    return None


def area_of(place):
    ca = place.get('complete_address') or {}
    city = ca.get('city') or ''
    borough = ca.get('borough') or ''
    address = place.get('address') or ''
    if 'nimman' in address.lower():
        return 'Nimman'
    # The district first: "Suthep" is also a road name outside Mueang.
    district = find(DISTRICTS, city) or (None if find([('m', MUEANG)], city) else find(DISTRICTS, address))
    if district:
        return district
    return find(MUEANG_AREAS, borough) or find(MUEANG_AREAS, address)


def haversine_km(a, b):
    p1, p2 = math.radians(a[0]), math.radians(b[0])
    dphi, dlmb = p2 - p1, math.radians(b[1] - a[1])
    h = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlmb / 2) ** 2
    return 2 * 6371 * math.asin(math.sqrt(h))


def clean_address(addr):
    addr = THAI_RUN.sub(" ", addr)
    addr = re.sub(r"(?:(?<=\s)|^)[.\-]+\S{0,2}(?=\s|,|$)", " ", addr)
    addr = re.sub(r"\s*,\s*,", ",", addr)
    addr = re.sub(r"^[\s,]+", "", addr)
    addr = re.sub(r"[ \t]+", " ", addr)
    return re.sub(r"\s*,\s*", ", ", addr).strip(", ").strip()


# Brackets with no letter or digit inside (any script), once Thai is taken out: "()", "( & )".
EMPTY_BRACKETS = re.compile(r'\([^\w)]*\)')
# Words that alone don't name a café: ". CAFE" (from "<Thai name>. CAFE") is not a name.
GENERIC = {'cafe', 'café', 'coffee', 'bar', 'tea', 'shop', 'house', 'home', 'homes', 'the', 'and', 'slow', 's', 'by'}


def tidy(text):
    """Collapse spaces, drop empty brackets, close or cut unbalanced ones, trim
    stray punctuation and a dangling "by" / "&" at the ends - but keep a
    closing bracket that belongs ("(มีใจให้มัทฉะ)")."""
    text = EMPTY_BRACKETS.sub(' ', text)
    while text.count('(') > text.count(')'):
        text = text[:text.rindex('(')]
    while text.count(')') > text.count('('):
        i = text.index(')')
        text = text[:i] + text[i + 1:]
    text = re.sub(r'\(\s+', '(', re.sub(r'\s+\)', ')', text))
    text = re.sub(r'\s{2,}', ' ', text)
    text = re.sub(r'^[\s.|\-·,:;=@&☕]+', '', text)
    # "(คาเมะคาเฟ่) - ถนนสนามกีฬา": a name that starts in brackets.
    text = re.sub(r'^\(([^)]*)\)', r'\1', text)
    text = re.sub(r'[\s.|\-·•,:;=@&]+$', '', text)
    text = re.sub(r'\s+(by|&|and|x)$', '', text, flags=re.I)
    return text.strip()


def is_untidy(name):
    """A name the round-2 cleaning left broken, e.g. "CHARLIE () Thai Tea … (Grab&Go"."""
    return tidy(name) != name or name.count('(') != name.count(')')


def clean_name(title):
    name = re.sub(r'[\u200b-\u200d]', '', unicodedata.normalize('NFKC', title))
    latin = tidy(THAI_RUN.sub(' ', name))
    # "s (SAAO BAHTs COFFEE)": the English name is the part in brackets.
    outside = re.sub(r'\([^)]*\)', ' ', latin)
    inside = re.findall(r'\(([^)]*)\)', latin)
    if len(re.findall(r'[A-Za-z0-9]', outside)) < 3 and inside:
        best = max(inside, key=lambda part: len(LATIN.findall(part)))
        if len(LATIN.findall(best)) >= 3:
            latin = tidy(best)
    words = {w.lower() for w in re.findall(r"[A-Za-zÀ-ÿ']+", latin)}
    # Keep the English name when there is one; a Thai-only name stays Thai.
    if len(LATIN.findall(latin)) >= 3 and not words <= GENERIC:
        return latin
    return tidy(name)


def slugify(s):
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode('ascii')
    return re.sub(r"-+", "-", re.sub(r"[^a-zA-Z0-9]+", "-", s).strip('-').lower())


def fmt_hours_24(open_hours):
    """Same as rounds 1-2: the first open day's hours, as "08:00–18:00"."""
    days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    raw = next((open_hours[d][0] for d in days
                if open_hours.get(d) and open_hours[d][0].strip().lower() != 'closed'), None)
    if raw is None:
        return "Hours vary"
    if 'open 24 hours' in raw.lower():
        return "00:00–00:00 (24h)"
    parts = re.split(r"[–-]", raw)
    if len(parts) != 2:
        return raw

    def to24(t, other_period=None):
        m = re.match(r"(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?", t.strip(), re.I)
        if not m:
            return t.strip()
        h, mi = int(m.group(1)), m.group(2) or "00"
        period = (m.group(3) or other_period or "").upper()
        if period == "PM" and h != 12:
            h += 12
        if period == "AM" and h == 12:
            h = 0
        return f"{h:02d}:{mi}"

    end_period = (re.search(r"(AM|PM)", parts[1], re.I) or [None, None])[1]
    has_own = re.search(r"AM|PM", parts[0], re.I)
    return f"{to24(parts[0], None if has_own else end_period and end_period.upper())}–{to24(parts[1])}"


# Thai words that, left alone next to an English name, are a location or branch.
PLACE_WORDS = sorted(
    {k for _, keys in MUEANG_AREAS + DISTRICTS for k in keys if THAI_RUN.fullmatch(k.replace('.', ''))}
    # Every sub-district searched in round 3 ("คาเฟ่ ต.สันนาเม็ง อ.สันทราย เชียงใหม่").
    | set(re.findall(r'ต\.(\S+)', open(os.path.join(HERE, 'queries-batch3.txt')).read()))
    | {'สาขา', 'จังหวัด', 'เชียงใหม่', 'อำเภอ', 'ตำบล', 'อ.', 'ต.', 'นิมมาน', 'นิมมานเหมินท์', 'คูเมือง', 'ถนน', 'ริมปิง'},
    key=len, reverse=True)


# Words of a Thai café name, as opposed to a branch or location.
NAME_HINTS = ('กาแฟ', 'คาเฟ่', 'ร้าน', 'คอฟฟี่', 'โรงคั่ว', 'เบเกอรี่', 'ขนม', 'ชา', 'บ้าน')


def thai_name(title, name):
    """The Thai title, minus the English name when Google shows both; None if no different Thai name."""
    if not THAI_RUN.search(title or ''):
        return None
    text = re.sub(r'[\u200b-\u200d]', '', unicodedata.normalize('NFKC', title))
    low, en = text.lower(), name.lower()
    if en and en in low:
        start = low.index(en)
        text = text[:start] + ' ' + text[start + len(en):]
        # What's left after the English name is usually the branch ("สาขา…",
        # "แยกหลุยส์"); keep it only when it reads as a café's Thai name
        # ("Banta Coffee. กาแฟบ้านตา").
        rest = text.strip(' .|-·,()')
        if rest.startswith('สาขา') or not any(w in rest for w in NAME_HINTS):
            return None
    text = tidy(text)
    if not THAI_RUN.search(text) or text == name:
        return None
    # "The Baristro Asian Style สุเทพ": only a place or branch, not a Thai name.
    rest = text
    for word in PLACE_WORDS:
        rest = rest.replace(word, ' ')
    if not THAI_RUN.search(rest):
        return None
    return text


# Google categories of places that are not cafés even when also tagged "Cafe".
EXCLUDED_CATEGORIES = {'cannabis store', 'cannabis club'}


def excluded(place):
    return any(c.lower() in EXCLUDED_CATEGORIES for c in place.get('categories') or [])


def main():
    raw = json.load(open(os.path.join(HERE, 'raw-all.json')))
    enrich = json.load(open(os.path.join(HERE, 'enrich3.json')))
    previous = json.load(open(CAFES))
    # Rounds 1-2 by index, not position: once one of them is excluded the
    # list is shorter, and slicing would pull round-3 cafés in twice.
    cafes = [c for c in previous if int(c['index']) <= FIRST_NEW]
    # A café keeps its slug from the last build even if its name is cleaned
    # up: the slug is its URL and the seed's key (a new one would duplicate it).
    slug_of = {c['index']: c['slug'] for c in previous}

    removed = 0
    for cafe in cafes:
        place = raw[int(cafe['index']) - 1]
        if is_untidy(cafe['name']):
            cafe['name'] = clean_name(place['title'])
    kept = [c for c in cafes if not excluded(raw[int(c['index']) - 1])]
    removed += len(cafes) - len(kept)
    cafes = kept

    slugs = set(slug_of.values())
    known = [((c['lat'], c['lng']), c['area']) for c in cafes]
    added, waiting, guessed = [], 0, 0
    for position in range(FIRST_NEW, len(raw)):
        place = raw[position]
        e = enrich.get(place.get('place_id'))
        if excluded(place):
            removed += 1
            continue
        if not e:
            waiting += 1
            continue
        here = (place['latitude'], place['longitude'])
        area = area_of(place)
        if not area:
            # No district or sub-district in the address: the nearest café's area.
            area = min(known, key=lambda k: haversine_km(here, k[0]))[1]
            guessed += 1
        known.append((here, area))

        name = clean_name(place['title'])
        slug = slug_of.get(f"{position + 1:03d}")
        if not slug:
            base = slugify(name)
            # A Thai name leaves little or nothing in ASCII ("", "2", "pt").
            if len(base.replace('-', '')) < 4 or base.replace('-', '').isdigit():
                base = f"cafe-{slugify(area)}-{position + 1}"
            slug = base if base not in slugs else f"{base}-{slugify(area)}"
            n = 2
            while slug in slugs:
                slug, n = f"{base}-{n}", n + 1
            slugs.add(slug)

        ca = place.get('complete_address') or {}
        address = clean_address(', '.join(filter(None, [ca.get('street'), ca.get('borough'), ca.get('city')])))
        added.append({
            'slug': slug,
            'index': f"{position + 1:03d}",
            'name': name,
            'area': area,
            'address': address or clean_address(place.get('address') or '') or 'Chiang Mai',
            'specialty': e['specialty'],
            'flavor': e['flavor'],
            'atmosphere': e['atmosphere'],
            'priceAvg': e['priceAvg'],
            'tags': e['tags'],
            'hours': fmt_hours_24(place.get('open_hours') or {}),
            'rating': place['review_rating'],
            'reviewCount': place['review_count'],
            'petFriendly': e['petFriendly'],
            'parking': e['parking'],
            'drinkType': e['drinkType'],
            'lat': place['latitude'],
            'lng': place['longitude'],
        })

    out = cafes + added
    names = json.load(open(os.path.join(HERE, 'names-th.json')))
    with_thai = 0
    for cafe in out:
        place = raw[int(cafe['index']) - 1]
        thai = thai_name(names.get(place.get('place_id')), cafe['name'])
        cafe.pop('nameTh', None)
        if thai:
            # Right after the name, to keep the JSON readable.
            items = list(cafe.items())
            cafe.clear()
            for key, value in items:
                cafe[key] = value
                if key == 'name':
                    cafe['nameTh'] = thai
            with_thai += 1
    json.dump(out, open(CAFES, 'w'), ensure_ascii=False, indent=2)
    open(CAFES, 'a').write('\n')
    json.dump({'count': len(out)}, open(COUNT, 'w'))
    open(COUNT, 'a').write('\n')
    print(f'{FIRST_NEW} + {len(added)} = {len(out)} cafés; {waiting} waiting for enrichment; {removed} not cafés (excluded categories); '
          f'{guessed} areas taken from the nearest café; {with_thai} with a Thai name')
    print('areas:', Counter(c['area'] for c in added).most_common())


if __name__ == '__main__':
    main()
