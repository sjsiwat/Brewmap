"""
Round 3: web/data/cafes.json = the 173 cafés of rounds 1-2, unchanged, then
every round-3 café in raw-all.json that `npm run ai:enrich` has described
(enrich3.json, keyed by place_id). A café without enrichment is left out
until it has one.

  python3 build_cafes_all.py

Also writes web/data/cafe-count.json, which the site shows as its café count.
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


def clean_name(title):
    name = unicodedata.normalize('NFKC', title)
    name = re.sub(r'[​-‍]', '', name)
    latin_only = re.sub(r'\s{2,}', ' ', THAI_RUN.sub('', name)).strip(' |-·,()')
    # Keep the English name when there is one; a Thai-only name stays Thai.
    if len(LATIN.findall(latin_only)) >= 3:
        name = latin_only
    return re.sub(r'\s{2,}', ' ', name).strip(' |-·,')


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


def main():
    raw = json.load(open(os.path.join(HERE, 'raw-all.json')))
    enrich = json.load(open(os.path.join(HERE, 'enrich3.json')))
    cafes = json.load(open(CAFES))[:FIRST_NEW]
    assert len(cafes) == FIRST_NEW

    slugs = {c['slug'] for c in cafes}
    known = [((c['lat'], c['lng']), c['area']) for c in cafes]
    added, waiting, guessed = [], 0, 0
    for position in range(FIRST_NEW, len(raw)):
        place = raw[position]
        e = enrich.get(place.get('place_id'))
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
        base = slugify(name) or 'cafe'
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
    json.dump(out, open(CAFES, 'w'), ensure_ascii=False, indent=2)
    open(CAFES, 'a').write('\n')
    json.dump({'count': len(out)}, open(COUNT, 'w'))
    open(COUNT, 'a').write('\n')
    print(f'{FIRST_NEW} + {len(added)} = {len(out)} cafés; {waiting} waiting for enrichment; '
          f'{guessed} areas taken from the nearest café')
    print('areas:', Counter(c['area'] for c in added).most_common())


if __name__ == '__main__':
    main()
