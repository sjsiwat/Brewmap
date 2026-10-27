import json, math, re, os, unicodedata, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

full = json.load(open(os.path.join(HERE, 'raw-full173.json')))
assert len(full) == 173

# --- reuse enrichment/overrides from the first 60 (import by exec to avoid cross-module path issues) ---
build60_path = os.path.join(HERE, 'build_cafes.py')
ns = {'__file__': build60_path}
src = open(build60_path).read()
# strip the bits that write files / run at import time; just grab the dicts
exec(compile(src, 'build_cafes_orig', 'exec'), ns)
ENRICH1 = ns['ENRICH']
NAME_OVERRIDE1 = ns['NAME_OVERRIDE']
ADDRESS_OVERRIDE1 = ns['ADDRESS_OVERRIDE']

from enrich2 import ENRICH2, NAME_OVERRIDE2, ADDRESS_OVERRIDE2, SLUG_OVERRIDE2

ENRICH = {**ENRICH1, **ENRICH2}
NAME_OVERRIDE = {**NAME_OVERRIDE1, **NAME_OVERRIDE2}
ADDRESS_OVERRIDE = {**ADDRESS_OVERRIDE1, **ADDRESS_OVERRIDE2}
assert len(ENRICH) == 173, len(ENRICH)

THAI_RUN = re.compile(r"[฀-๿]+")

def clean_address(addr):
    addr = THAI_RUN.sub(" ", addr)
    addr = re.sub(r"(?:(?<=\s)|^)[.\-]+\S{0,2}(?=\s|,|$)", " ", addr)
    addr = re.sub(r"\s*,\s*,", ",", addr)
    addr = re.sub(r"^[\s,]+", "", addr)
    addr = re.sub(r"[ \t]+", " ", addr)
    addr = re.sub(r"\s*,\s*", ", ", addr).strip(", ").strip()
    return addr

def slugify(s):
    s = unicodedata.normalize('NFKD', s)
    s = s.encode('ascii', 'ignore').decode('ascii')
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip('-').lower()
    s = re.sub(r"-+", "-", s)
    return s

def haversine_km(lat1, lng1, lat2, lng2):
    R = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2-lat1)
    dlmb = math.radians(lng2-lng1)
    a = math.sin(dphi/2)**2 + math.cos(p1)*math.cos(p2)*math.sin(dlmb/2)**2
    return 2*R*math.asin(math.sqrt(a))

AREA_RULES = [
    ('Nimman', ['nimman']),
    ('Old City', ['old city', 'si phum', 'phra sing', 'sripoom']),
    ('Chang Phueak', ['chang phueak', 'changpuek', 'ช้างเผือก']),
    ('Wat Ket', ['wat ket']),
    ('Chang Khlan', ['chang khlan']),
    ('Chang Moi', ['chang moi']),
    ('Nong Hoi', ['nong hoi']),
    ('Wualai', ['haiya']),
    ('Fa Ham', ['fa ham']),
    ('San Phi Suea', ['san phi suea']),
    ('Tha Sala', ['tha sala']),
    ('Pa Daet', ['pa daet']),
    ('Nong Pa Khrang', ['nong pa khrang']),
    ('Mae Rim', ['don kaeo', 'mae rim', 'maejo', 'แม่โจ้']),
    ('Hang Dong', ['nong kwai', 'hang dong']),
    ('Ping Riverside', ['pa tan']),
    ('Suthep', ['suthep']),
]

def map_area(raw_area, full_address_hint=''):
    low = (raw_area or '').lower()
    for label, keys in AREA_RULES:
        for k in keys:
            if k in low or k in (full_address_hint or '').lower():
                return label
    # fallback: strip thai, title-case what's left, else generic
    cleaned = clean_address(raw_area or '')
    return cleaned if cleaned else 'Chiang Mai'

def fmt_hours_24(open_hours):
    days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
    raw = None
    for d in days:
        v = open_hours.get(d)
        if v and v[0].strip().lower() not in ('closed',):
            raw = v[0]
            break
    if raw is None:
        return "Hours vary"
    if 'open 24 hours' in raw.lower():
        return "00:00–00:00 (24h)"
    parts = re.split(r"[–-]", raw)
    if len(parts) != 2:
        return raw
    def to24(t, other_period=None):
        t = t.strip()
        m = re.match(r"(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?", t, re.I)
        if not m: return t
        h = int(m.group(1)); mi = m.group(2) or "00"; period = (m.group(3) or other_period or "").upper()
        if period == "PM" and h != 12:
            h += 12
        if period == "AM" and h == 12:
            h = 0
        return f"{h:02d}:{mi}"
    end_period_m = re.search(r"(AM|PM)", parts[1], re.I)
    end_period = end_period_m.group(1).upper() if end_period_m else None
    start = to24(parts[0], end_period if 'AM' not in parts[0].upper() and 'PM' not in parts[0].upper() else None)
    end = to24(parts[1])
    return f"{start}–{end}"

cafes = []
for i, r in enumerate(full, 1):
    ca = r.get('complete_address') or {}
    raw_area = ca.get('borough') or ca.get('city') or ''
    area = AREA_MAP_RESULT = map_area(raw_area, r.get('address'))
    street = ca.get('street') or ''
    city = ca.get('city') or 'Mueang Chiang Mai District'
    if not THAI_RUN.sub('', city).strip():
        city = 'Mueang Chiang Mai District'
    address = ADDRESS_OVERRIDE.get(i) or clean_address(', '.join(filter(None, [street, raw_area, city])))
    e = ENRICH[i]
    raw_title = NAME_OVERRIDE.get(i, r['title'])
    name = unicodedata.normalize('NFKD', raw_title)
    name = THAI_RUN.sub('', name).strip()
    name = re.sub(r'[​‌‍]', '', name)
    name = re.sub(r'\s{2,}', ' ', name).strip(' |-')
    cafes.append({
        'slug': SLUG_OVERRIDE2.get(i) or slugify(NAME_OVERRIDE.get(i, raw_title)),
        'index': f"{i:03d}",
        'name': name,
        'area': area,
        'address': address,
        'specialty': e['specialty'],
        'flavor': e['flavor'],
        'atmosphere': e['atmosphere'],
        'priceAvg': e['price'],
        'tags': e['tags'],
        'hours': fmt_hours_24(r.get('open_hours') or {}),
        'rating': r['review_rating'],
        'reviewCount': r['review_count'],
        'petFriendly': e['petFriendly'],
        'parking': e['parking'],
        'drinkType': e['drinkType'],
        'lat': r['latitude'],
        'lng': r['longitude'],
    })

OUT = os.path.join(HERE, '..', '..', 'data', 'cafes.json')
os.makedirs(os.path.dirname(OUT), exist_ok=True)
json.dump(cafes, open(OUT, 'w'), ensure_ascii=False, indent=2)
print('built', len(cafes), 'cafes')

# sanity checks
slugs = [c['slug'] for c in cafes]
dups = len(slugs) - len(set(slugs))
print('dup slugs:', dups)
if dups:
    from collections import Counter
    cnt = Counter(slugs)
    for s, n in cnt.items():
        if n > 1:
            print('  DUP:', s, n)

thai_re = re.compile(r'[฀-๿]')
for c in cafes:
    for k in ('name', 'address', 'area'):
        v = c[k]
        if thai_re.search(v) and '฿' not in v:
            print('THAI LEFTOVER', c['index'], k, '->', v)
