import type { AppliedFilters } from './dto/ai.dto';

/**
 * Deterministic checks on the visitor's own words, applied after Gemini's
 * filters are sanitized. The small model sometimes drops a filter that was
 * clearly asked for ("มีที่จอดรถ") or invents one that wasn't (an area or a
 * radius nobody mentioned), so the words in the request have the last say.
 */

const PARKING = /ที่จอด|จอดรถ|ขับรถ|parking|\bcars?\b|\bdrive\b|\bdriving\b/i;
const PETS =
  /หมา|สุนัข|สัตว์เลี้ยง|(พา|เอา|กับ)(น้อง)?แมว|\b(dogs?|pets?|pupp(y|ies))\b|pet-friendly|(bring|with) (my |our )?cats?\b/i;
// Matcha cafés are mostly coffee shops that also serve matcha (drinkType
// "Coffee"), so matcha is the "Matcha" tag, never a drink type.
const MATCHA = /มัทฉะ|มัจฉะ|มัชฉะ|matcha/i;
const THAI_TEA = /ชาไทย|ชาเย็น|thai tea/i;
// "ไม่เกิน 150 บาท", "under 100 baht", "budget ฿120": a top drink price.
const MAX_PRICE =
  /(?:ไม่เกิน|ต่ำกว่า|ไม่ถึง|ราคา|งบ|under|below|less than|up to|max(?:imum)?|budget)\s*(?:฿\s*)?(\d{2,4})\s*(?:บาท|฿|baht|thb|b\b)?/i;
// A radius only makes sense when the request talks about distance.
const NEAR =
  /ใกล้|แถว|ละแวก|ไม่ไกล|เดิน(ได้|ไป|ถึง)?|กม|กิโล|เมตร|นาที|\b(near|nearby|close|around|walk(ing)?|within|radius|km|kilomet(er|re)s?|minutes?)\b/i;
// An explicit distance ("ไม่เกิน 3 กม.") can sit next to an area.
const DISTANCE = /\d\s*(กม|กิโล|เมตร|km|kilomet|m\b|นาที|min)/i;

/** Words that name each area: English name, Thai name, and a few landmarks. */
const AREA_WORDS: Record<string, string[]> = {
  'Old City': [
    'old city',
    'คูเมือง',
    'เมืองเก่า',
    'ประตูท่าแพ',
    'tha phae',
    'thapae',
    'ท่าแพ',
  ],
  Nimman: ['nimman', 'nimmana', 'นิมมาน', 'maya', 'เมญ่า', 'one nimman'],
  'Chang Khlan': ['chang khlan', 'ช้างคลาน', 'night bazaar', 'ไนท์บาซาร์'],
  'Chang Moi': ['chang moi', 'ช้างม่อย', 'warorot', 'วโรรส', 'กาดหลวง'],
  'Chang Phueak': ['chang phueak', 'ช้างเผือก', 'chang puak'],
  'Fa Ham': ['fa ham', 'ฟ้าฮ่าม'],
  'Mae Hia': ['mae hia', 'แม่เหียะ'],
  'Nong Hoi': ['nong hoi', 'หนองหอย'],
  'Nong Pa Khrang': ['nong pa khrang', 'หนองป่าครั่ง'],
  'Pa Daet': ['pa daet', 'ป่าแดด'],
  'Ping Riverside': [
    'ping river',
    'riverside',
    'ริมน้ำปิง',
    'ริมปิง',
    'แม่น้ำปิง',
  ],
  'San Phi Suea': ['san phi suea', 'สันผีเสื้อ'],
  Suthep: [
    'suthep',
    'สุเทพ',
    'cmu',
    'chiang mai university',
    'doi suthep',
    'ดอยสุเทพ',
  ],
  'Tha Sala': ['tha sala', 'ท่าศาลา'],
  'Wat Ket': ['wat ket', 'วัดเกต'],
  Wualai: ['wualai', 'wua lai', 'วัวลาย'],
  'Hang Dong': ['hang dong', 'หางดง'],
  'San Sai': ['san sai', 'สันทราย'],
  'San Kamphaeng': ['san kamphaeng', 'สันกำแพง'],
  Saraphi: ['saraphi', 'สารภี'],
  'Mae Rim': ['mae rim', 'แม่ริม'],
  'Doi Saket': ['doi saket', 'ดอยสะเก็ด'],
};

/** Areas the request names, in the order of AREA_WORDS. */
export function areasMentioned(request: string, areas: string[]): string[] {
  const text = request.toLowerCase();
  return areas.filter((area) =>
    [area.toLowerCase(), ...(AREA_WORDS[area] ?? [])].some((word) =>
      // Latin words whole ("cmu", not inside another word); Thai has no spaces.
      /^[a-z ]+$/.test(word)
        ? new RegExp(`\\b${word}\\b`).test(text)
        : text.includes(word),
    ),
  );
}

export interface RuledFilters {
  filters: AppliedFilters;
  /** Filters the request itself asks for: relaxed only after the others. */
  pinned: (keyof AppliedFilters)[];
}

export function applyRequestRules(
  request: string,
  proposed: AppliedFilters,
  context: { tags: string[]; areas: string[]; hasOrigin: boolean },
): RuledFilters {
  const filters: AppliedFilters = { ...proposed };
  const pinned: (keyof AppliedFilters)[] = [];

  if (PARKING.test(request)) filters.parking = true;
  if (PETS.test(request)) filters.petFriendly = true;

  const price = MAX_PRICE.exec(request);
  // Not a distance ("ไม่เกิน 3 กม.") or a time ("under 10 minutes").
  const end = price ? price.index + price[0].length : 0;
  if (price && !DISTANCE.test(price[0] + request.slice(end, end + 6))) {
    filters.maxPrice = Number(price[1]);
    if (filters.minPrice !== undefined && filters.minPrice > filters.maxPrice) {
      delete filters.minPrice;
    }
  }

  const drinkTag = MATCHA.test(request)
    ? 'Matcha'
    : THAI_TEA.test(request)
      ? 'Thai tea'
      : undefined;
  if (drinkTag && context.tags.includes(drinkTag)) {
    filters.tag = drinkTag;
    delete filters.drinkType;
    pinned.push('tag');
  }

  const named = areasMentioned(request, context.areas);
  if (!named.length) delete filters.area;
  else {
    if (!filters.area || !named.includes(filters.area)) filters.area = named[0];
    pinned.push('area');
  }

  // "แถวนิมมาน" is an area, not "5 km from me"; keep a radius next to an area
  // only when the request gives a distance.
  const keepRadius =
    context.hasOrigin &&
    (filters.area ? DISTANCE.test(request) : NEAR.test(request));
  if (!keepRadius) delete filters.radiusKm;

  return { filters, pinned };
}
