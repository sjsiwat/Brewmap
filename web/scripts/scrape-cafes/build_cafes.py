import json, math, re, os, unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
top = json.load(open(os.path.join(HERE, 'raw-top60.json')))

REF_LAT, REF_LNG = 18.7876, 98.9933  # Tha Phae Gate, Old City - central CM reference

AREA_MAP = {
    'Nimmanhaemin Suthep': 'Nimman',
    'Old City Si Phum': 'Old City',
    'Old City Phra Sing': 'Old City',
    'Suthep': 'Suthep',
    'Chang Phueak': 'Chang Phueak',
    'Pa Tan Sub-district': 'Ping Riverside',
    'Wat Ket': 'Wat Ket',
    'Chang Khlan Sub-district': 'Chang Khlan',
    'Nong Kwai': 'Hang Dong',
    'Chang Moi Sub-district': 'Chang Moi',
    'Nong Hoi Sub-district': 'Nong Hoi',
    'Haiya Sub-district': 'Wualai',
}

def slugify(s):
    s = unicodedata.normalize('NFKD', s)
    s = s.encode('ascii', 'ignore').decode('ascii')
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip('-').lower()
    s = re.sub(r"-+", "-", s)
    return s


import re as _re
THAI_RUN = _re.compile(r"[\u0E00-\u0E7F]+")
def clean_address(addr):
    addr = THAI_RUN.sub(" ", addr)
    # drop stray lone-punctuation tokens left behind by removed Thai abbreviations (e.g. "." "-" ".8")
    addr = _re.sub(r"(?:(?<=\s)|^)[.\-]+\S{0,2}(?=\s|,|$)", " ", addr)
    addr = _re.sub(r"\s*,\s*,", ",", addr)
    addr = _re.sub(r"^[\s,]+", "", addr)
    addr = _re.sub(r"[ \t]+", " ", addr)
    addr = _re.sub(r"\s*,\s*", ", ", addr).strip(", ").strip()
    return addr

def haversine_km(lat1, lng1, lat2, lng2):
    R = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2-lat1)
    dlmb = math.radians(lng2-lng1)
    a = math.sin(dphi/2)**2 + math.cos(p1)*math.cos(p2)*math.sin(dlmb/2)**2
    return 2*R*math.asin(math.sqrt(a))

def fmt_hours_24(open_hours):
    days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
    raw = None
    for d in days:
        v = open_hours.get(d)
        if v and v[0].strip().lower() != 'closed':
            raw = v[0]
            break
    if raw is None:
        return "Hours vary"
    # raw like "8 AM–6 PM" or "8:30 AM–6:30 PM" or "12–10 PM"
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


NAME_OVERRIDE = {
    15: "Cat's Alley Cafe",
    22: "Samorn Cafe Chiangmai",
    26: "MoR Ministry of Roasters",
    34: "Thor-Phan Coffee Roaster",
    42: "Chic Ruedoo",
    47: "Fahtara Coffee",
    56: "Ma Lune Thai Specialty Coffee Roaster",
}


ADDRESS_OVERRIDE = {
    9: "9 Nimmanhaemin Soi 9, Nimmanhaemin Suthep, Mueang Chiang Mai District",
    32: "155/4 Soi 8, Chang Phueak, Mueang Chiang Mai District",
    36: "200/3 Ratchaphakhinai Rd, Old City Si Phum, Mueang Chiang Mai District",
    43: "1/4 Soi Sotsuksa, Chang Phueak, Mueang Chiang Mai District",
    57: "11 Sridonchai Rd, Chang Khlan Sub-district, Mueang Chiang Mai District",
    59: "33/1 Chomdoi Soi 1, Nimmanhaemin Suthep, Mueang Chiang Mai District",
}

ENRICH = {
1: dict(specialty="Japanese-garden matcha & pink soda", flavor="Green-tea forward, mixed menu", atmosphere="Spacious, garden, lively", price=120, tags=["Garden","Matcha","Big groups"], petFriendly=False, parking=False, drinkType="Coffee"),
2: dict(specialty="Hojicha latte & specialty espresso", flavor="Mild, delicate aroma", atmosphere="Stylish, music-driven, indie", price=110, tags=["Specialty","Design-forward"], petFriendly=False, parking=False, drinkType="Coffee"),
3: dict(specialty="Dirty coffee, Chiang Mai-grown beans", flavor="Balanced, locally roasted", atmosphere="Relaxed, slow, Old City", price=105, tags=["Roastery","Quiet","Dirty coffee"], petFriendly=False, parking=False, drinkType="Coffee"),
4: dict(specialty="All-day brunch with live music", flavor="Approachable, crowd-pleasing", atmosphere="Warm, lively, live music", price=150, tags=["Live music","Brunch","Social"], petFriendly=False, parking=False, drinkType="Coffee"),
5: dict(specialty="Garden breakfast & smoothie bowls", flavor="Fresh, fruit-forward", atmosphere="Garden, quiet mornings", price=150, tags=["Garden","Breakfast","Quiet"], petFriendly=False, parking=False, drinkType="Coffee"),
6: dict(specialty="Riverside industrial cafe, creative menu", flavor="Full-bodied, varied", atmosphere="Industrial, riverside, calm", price=130, tags=["River view","Work-friendly","Quiet"], petFriendly=False, parking=False, drinkType="Coffee"),
7: dict(specialty="Pistachio-raspberry croissant & Coconut Dirty", flavor="Buttery pastries, smooth coffee", atmosphere="Art-gallery, creative, work-friendly", price=140, tags=["Art space","Work-friendly","Dessert"], petFriendly=False, parking=False, drinkType="Coffee"),
8: dict(specialty="Wood-fired pizza & passionfruit coconut smoothie", flavor="Not too sweet, balanced", atmosphere="Calming, family-friendly, garden", price=200, tags=["Food-forward","Family","Garden"], petFriendly=False, parking=False, drinkType="Non-Coffee"),
9: dict(specialty="Craft Thai tea flights", flavor="Thai tea, customizable sweetness", atmosphere="Small, cozy", price=80, tags=["Thai tea","Budget-friendly"], petFriendly=False, parking=False, drinkType="Tea"),
10: dict(specialty="Mango sticky rice & Thai milk tea", flavor="Sweet, dessert-forward", atmosphere="Quiet, tiny, cozy", price=65, tags=["Dessert","Budget-friendly","Quiet"], petFriendly=False, parking=False, drinkType="Tea"),
11: dict(specialty="Riverside roastery, bean flights", flavor="Varied roast profiles", atmosphere="Japanese-inspired, riverside, cozy", price=130, tags=["Roastery","River view"], petFriendly=False, parking=False, drinkType="Coffee"),
12: dict(specialty="Ceremonial matcha latte", flavor="Less sweet, high-grade matcha", atmosphere="Tranquil, Japanese, cat-friendly", price=130, tags=["Matcha","Quiet","Pet-friendly"], petFriendly=True, parking=False, drinkType="Tea"),
13: dict(specialty="Ristretto flat white, award-roasted beans", flavor="Balanced, flavorful", atmosphere="Quiet outdoor, lively indoor", price=140, tags=["Roastery","Award-winning","Quiet"], petFriendly=False, parking=False, drinkType="Coffee"),
14: dict(specialty="Artisan gelato, rotating flavors", flavor="Creamy, rich", atmosphere="Playful, neon, unique", price=90, tags=["Dessert","Gelato"], petFriendly=False, parking=False, drinkType="Non-Coffee"),
15: dict(specialty="Cat-café experience + light snacks", flavor="Simple snack menu", atmosphere="Playful, cat-filled", price=150, tags=["Cat cafe","Pet-friendly","Unique"], petFriendly=True, parking=False, drinkType="Coffee"),
16: dict(specialty="Samoyed dog café & Hainanese chicken rice", flavor="Savory, food-forward", atmosphere="Vibrant, dog-filled, shady", price=120, tags=["Dog cafe","Pet-friendly","Parking"], petFriendly=True, parking=True, drinkType="Coffee"),
17: dict(specialty="Smoothie bowls & brunch pasta", flavor="Fresh, approachable", atmosphere="Ambient, photogenic, brunch", price=180, tags=["Brunch","Photogenic","Eco-friendly"], petFriendly=False, parking=False, drinkType="Non-Coffee"),
18: dict(specialty="Coffee flight tasting", flavor="Rich, smooth, vibrant", atmosphere="Modern, serious coffee culture", price=150, tags=["Roastery","Award-winning","Specialty"], petFriendly=False, parking=False, drinkType="Coffee"),
19: dict(specialty="Matcha & cappuccino, 3-floor coworking", flavor="Can be inconsistent", atmosphere="Multi-floor, laid-back", price=130, tags=["Work-friendly","Multi-floor"], petFriendly=False, parking=False, drinkType="Coffee"),
20: dict(specialty="Koi-carp pond dining", flavor="Well-made, professional", atmosphere="Unique, nature, peaceful", price=250, tags=["Unique concept","Nature","Photogenic"], petFriendly=False, parking=False, drinkType="Non-Coffee"),
21: dict(specialty="Latte-art showcase espresso", flavor="Strong aroma, rich", atmosphere="Small, busy, artisanal", price=130, tags=["Latte art","Specialty","Famous"], petFriendly=False, parking=False, drinkType="Coffee"),
22: dict(specialty="Dachshund café & creative cakes", flavor="Sweet, creative dessert pairings", atmosphere="Playful, dog-filled, festive", price=130, tags=["Dog cafe","Pet-friendly","Dessert"], petFriendly=True, parking=False, drinkType="Coffee"),
23: dict(specialty="Mango sticky rice bingsu", flavor="Sweet, Thai-dessert fusion", atmosphere="Lively dessert house", price=180, tags=["Dessert","Bingsu"], petFriendly=False, parking=False, drinkType="Non-Coffee"),
24: dict(specialty="Coconut cream pie & custom-strength coffee", flavor="Light, not-too-sweet custard", atmosphere="Humble, dessert-focused", price=110, tags=["Dessert","Pie","Budget-friendly"], petFriendly=False, parking=False, drinkType="Coffee"),
25: dict(specialty="House-roasted dirty coffee & Thai tea", flavor="Unique, unexpected, high quality", atmosphere="Passionate owner-run", price=130, tags=["Roastery","Dirty coffee","Specialty"], petFriendly=False, parking=False, drinkType="Coffee"),
26: dict(specialty="Single-origin dirty coffee, multi-region beans", flavor="Nuanced, well-extracted", atmosphere="Cozy, modern, educational", price=140, tags=["Roastery","Specialty","Educational"], petFriendly=False, parking=False, drinkType="Coffee"),
27: dict(specialty="Bean-to-bar Thai chocolate flight", flavor="Craft chocolate, origin-specific", atmosphere="Quirky, educational, cat on-site", price=150, tags=["Chocolate","Pet-friendly","Unique"], petFriendly=True, parking=False, drinkType="Non-Coffee"),
28: dict(specialty="Matcha & pastries, family bistro", flavor="Smooth, rich", atmosphere="Bright, family, spacious", price=150, tags=["Family-friendly","Brunch","Spacious"], petFriendly=False, parking=False, drinkType="Non-Coffee"),
29: dict(specialty="Farm-to-table dirty latte", flavor="Rich, concentrated, vanilla-forward", atmosphere="Calm, no-nonsense, authentic", price=110, tags=["Farm-to-table","Dirty coffee","Quiet"], petFriendly=False, parking=False, drinkType="Coffee"),
30: dict(specialty="Light-roast drip coffee", flavor="Light roast, clean", atmosphere="Relaxed, central, gate view", price=80, tags=["Budget-friendly","Pour-over","Central"], petFriendly=False, parking=False, drinkType="Coffee"),
31: dict(specialty="Eggs Benedict & weekend pizza nights", flavor="Hearty, Western breakfast", atmosphere="Casual, open-air", price=180, tags=["Breakfast","Open-air"], petFriendly=False, parking=False, drinkType="Non-Coffee"),
32: dict(specialty="Garden-house café & light meals", flavor="Can run watery", atmosphere="Shady garden, calm", price=120, tags=["Garden","Guesthouse"], petFriendly=False, parking=False, drinkType="Coffee"),
33: dict(specialty="Late-night specialty coffee, decaf available", flavor="Deep, robust, Vietnamese-style", atmosphere="Late-night, casual", price=110, tags=["Late-night","Decaf available"], petFriendly=False, parking=False, drinkType="Coffee"),
34: dict(specialty="Velvety specialty filter coffee", flavor="Smooth, cocoa, chocolatey", atmosphere="Work-friendly, fast wifi", price=100, tags=["Work-friendly","Roastery","Specialty"], petFriendly=False, parking=False, drinkType="Coffee"),
35: dict(specialty="Rooftop mountain-view coffee", flavor="Good beans, variable mixes", atmosphere="Hidden rooftop, nomad-popular", price=120, tags=["Scenic view","Digital nomad","Hidden gem"], petFriendly=False, parking=False, drinkType="Coffee"),
36: dict(specialty="Homemade focaccia breakfast", flavor="Homemade, genuine", atmosphere="Cozy, quiet, family-run", price=140, tags=["Quiet","Homemade","Breakfast"], petFriendly=False, parking=False, drinkType="Coffee"),
37: dict(specialty="Whimsical themed café & board games", flavor="Smooth matcha, balanced", atmosphere="Whimsical, quirky, work-friendly", price=130, tags=["Themed","Work-friendly","Board games"], petFriendly=False, parking=False, drinkType="Coffee"),
38: dict(specialty="Es Yen with date sugar, locally grown beans", flavor="Educational, fermentation notes", atmosphere="Barn theme, calm, bright", price=90, tags=["Educational","Local beans","Unique theme"], petFriendly=False, parking=False, drinkType="Coffee"),
39: dict(specialty="Strawberry matcha latte & tiramisu", flavor="Sweet, balanced", atmosphere="Spacious, co-working, garden", price=80, tags=["Work-friendly","Budget-friendly","Pet-friendly","Garden"], petFriendly=True, parking=False, drinkType="Coffee"),
40: dict(specialty="Purple sweet-potato bun, CMU campus views", flavor="Average on specialty drinks, solid standard", atmosphere="Spacious, glass-walled, study-friendly", price=90, tags=["Study-friendly","Scenic view","Campus"], petFriendly=False, parking=False, drinkType="Coffee"),
41: dict(specialty="Hostel café, bean flights to go", flavor="Good roast selection", atmosphere="All-white, calm, work-friendly", price=120, tags=["Work-friendly","Hostel-cafe"], petFriendly=False, parking=False, drinkType="Coffee"),
42: dict(specialty="Turkish eggs & homemade Greek yogurt", flavor="High quality, house-made", atmosphere="Chill, cozy, dog-friendly", price=150, tags=["Pet-friendly","Work-friendly","Garden"], petFriendly=True, parking=False, drinkType="Non-Coffee"),
43: dict(specialty="Bright, clean Americano", flavor="Bright acidity, clean", atmosphere="Warm, cozy, unpretentious", price=90, tags=["Budget-friendly","Specialty"], petFriendly=False, parking=False, drinkType="Coffee"),
44: dict(specialty="Single-origin Panama Geisha & Honduras", flavor="Rich, complex, whisky-like", atmosphere="Casual, chatty, not laptop-focused", price=150, tags=["Single-origin","Specialty","Roastery"], petFriendly=False, parking=False, drinkType="Coffee"),
45: dict(specialty="Premium single-origin cappuccino", flavor="Premium, well-balanced", atmosphere="Charming, cozy", price=85, tags=["Specialty","Cozy"], petFriendly=False, parking=False, drinkType="Coffee"),
46: dict(specialty="Affogato & bold espresso", flavor="Bold, pairs with ice cream", atmosphere="Minimalist, bright, open", price=120, tags=["Specialty","Minimalist design"], petFriendly=False, parking=False, drinkType="Coffee"),
47: dict(specialty="Mango sticky rice drink & Thai desserts", flavor="Sweet, Thai-dessert fusion", atmosphere="Thai-themed, photogenic, spa-adjacent", price=150, tags=["Photogenic","Thai-themed","Dessert"], petFriendly=False, parking=False, drinkType="Non-Coffee"),
48: dict(specialty="Affogato with coconut ice cream", flavor="Rich, coconut-forward", atmosphere="Museum garden, quiet, work-friendly", price=90, tags=["Work-friendly","Hidden gem","Museum setting"], petFriendly=False, parking=False, drinkType="Coffee"),
49: dict(specialty="Pour-over & matcha", flavor="Quality beans, careful brew", atmosphere="Warm, Thai-style, quiet", price=110, tags=["Pour-over","Matcha","Quiet","Work-friendly"], petFriendly=False, parking=False, drinkType="Coffee"),
50: dict(specialty="Cold brew & pour-over flights", flavor="Clean, educational single-origin", atmosphere="Quiet, relaxing, educational", price=120, tags=["Pour-over","Cold brew","Educational","Quiet"], petFriendly=False, parking=False, drinkType="Coffee"),
51: dict(specialty="Riverside iced peach tea & cocoa latte", flavor="Not too sweet, fruity", atmosphere="Riverside, peaceful, no AC", price=70, tags=["River view","Pet-friendly","Budget-friendly","Hidden gem"], petFriendly=True, parking=False, drinkType="Tea"),
52: dict(specialty="Cocoa orange drink & specialty coffee", flavor="Well-balanced, high quality", atmosphere="Calm, minimalistic, neighborhood", price=80, tags=["Budget-friendly","Quiet","Work-friendly"], petFriendly=False, parking=False, drinkType="Coffee"),
53: dict(specialty="Single-origin flat white, roasted on-site", flavor="Fresh, aromatic, fruity options", atmosphere="Small, cozy, friendly owners", price=70, tags=["Budget-friendly","Roastery","Hidden gem"], petFriendly=False, parking=False, drinkType="Coffee"),
54: dict(specialty="Filtered PANGHAI single-origin coffee", flavor="Premium, well-brewed", atmosphere="Stylish, relaxing, cushioned seats", price=140, tags=["Pour-over","Single-origin","Cozy"], petFriendly=False, parking=False, drinkType="Coffee"),
55: dict(specialty="Japanese-garden café, seasonal cakes", flavor="Yummy cakes & coffee", atmosphere="Minimalist, peaceful, garden", price=130, tags=["Garden","Quiet","Work-friendly"], petFriendly=False, parking=False, drinkType="Coffee"),
56: dict(specialty="Floral, fruity light-roast pour-over", flavor="Floral, fruity, light roast", atmosphere="Chill, attentive service", price=120, tags=["Pour-over","Roastery","Specialty"], petFriendly=False, parking=False, drinkType="Coffee"),
57: dict(specialty="Cold brew & rich espresso", flavor="Rich, never watered down", atmosphere="Cozy, modern, small", price=90, tags=["Specialty","Cozy"], petFriendly=False, parking=False, drinkType="Coffee"),
58: dict(specialty="Cheese pastry & cheesecake", flavor="Rich, sweet, crispy", atmosphere="Peaceful, date-friendly", price=150, tags=["Dessert","Parking"], petFriendly=False, parking=True, drinkType="Non-Coffee"),
59: dict(specialty="Crepes & soft matcha latte", flavor="Delicious, soft, balanced", atmosphere="Warm, pet-friendly, air-purified", price=130, tags=["Pet-friendly","Dessert","Work-friendly"], petFriendly=True, parking=False, drinkType="Coffee"),
60: dict(specialty="Fresh croissants & brunch bakery", flavor="Fresh, high-quality pastry", atmosphere="Warm, bustling with families", price=140, tags=["Bakery","Brunch"], petFriendly=False, parking=False, drinkType="Non-Coffee"),
}

cafes = []
for i, r in enumerate(top, 1):
    ca = r.get('complete_address') or {}
    raw_area = ca.get('borough') or ca.get('city') or ''
    area = AREA_MAP.get(raw_area, raw_area or 'Chiang Mai')
    # prefer "Nimman" label when address literally says Nimman but admin area differs
    if 'nimman' in (r.get('address') or '').lower() and area not in ('Nimman',):
        area = 'Nimman'
    street = ca.get('street') or ''
    city = ca.get('city') or 'Mueang Chiang Mai District'
    if not THAI_RUN.sub('', city).strip():
        city = 'Mueang Chiang Mai District'
    address = ADDRESS_OVERRIDE.get(i) or clean_address(', '.join(filter(None, [street, raw_area, city])))
    dist_km = haversine_km(REF_LAT, REF_LNG, r['latitude'], r['longitude'])
    e = ENRICH[i]
    cafes.append({
        'slug': slugify(NAME_OVERRIDE.get(i, r['title'])),
        'index': f"{i:02d}",
        'name': NAME_OVERRIDE.get(i, r['title']).strip(),
        'area': area,
        'address': address,
        'specialty': e['specialty'],
        'flavor': e['flavor'],
        'atmosphere': e['atmosphere'],
        'price': f"~{e['price']}฿",
        'distance': f"{dist_km:.1f} km",
        'tags': e['tags'],
        'hours': fmt_hours_24(r.get('open_hours') or {}),
        'rating': r['review_rating'],
        'reviewCount': r['review_count'],
        'petFriendly': e['petFriendly'],
        'parking': e['parking'],
        'drinkType': e['drinkType'],
        'lat': r['latitude'],
        'lng': r['longitude'],
        'source_place_id': r.get('place_id'),
    })

json.dump(cafes, open(os.path.join(HERE, 'enriched-output.json'), 'w'), ensure_ascii=False, indent=2)
print('built', len(cafes), 'cafes')
for c in cafes[:3]:
    print(c['index'], c['name'], c['area'], c['distance'], c['hours'], c['price'])
