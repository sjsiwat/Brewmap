/**
 * Weekly opening hours, parsed from the Google Maps scrape ("8 AM–6 PM",
 * "7 AM–1 AM", "Closed", "Open 24 hours"). All times are Chiang Mai time.
 */

/** One stretch of opening time. */
export interface OpeningPeriod {
  /** Day it opens: 0 = Sunday … 6 = Saturday. */
  day: number;
  /** Minutes after midnight, 0-1439. */
  open: number;
  /** Minutes after midnight of `day`; above 1440 when it closes after midnight. */
  close: number;
}

export const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

const MINUTES_PER_DAY = 24 * 60;
const TIME_ZONE = 'Asia/Bangkok';

/** "8", "8:30" with "AM"/"PM" → minutes after midnight; 12 AM is midnight. */
function toMinutes(time: string, meridiem: string): number | null {
  const match = /^(\d{1,2})(?::(\d{2}))?$/.exec(time.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2] ?? 0);
  if (hour < 1 || hour > 12 || minute > 59) return null;
  return ((hour % 12) + (meridiem === 'PM' ? 12 : 0)) * 60 + minute;
}

/**
 * One day's text from the scrape → its periods, [] when closed, or null when
 * the text can't be read (so we never guess). The start may leave out AM/PM
 * when it's the same as the end's: "12–10 PM".
 */
export function parseDayHours(
  text: string,
): Array<{ open: number; close: number }> | null {
  const value = text.trim();
  if (/^closed$/i.test(value)) return [];
  if (/^open 24 hours$/i.test(value))
    return [{ open: 0, close: MINUTES_PER_DAY }];
  const match =
    /^(\d{1,2}(?::\d{2})?)\s*(AM|PM)?\s*[–-]\s*(\d{1,2}(?::\d{2})?)\s*(AM|PM)$/i.exec(
      value,
    );
  if (!match) return null;
  const endMeridiem = match[4].toUpperCase();
  const open = toMinutes(match[1], (match[2] ?? endMeridiem).toUpperCase());
  let close = toMinutes(match[3], endMeridiem);
  if (open === null || close === null) return null;
  // Closing at or before the opening time means after midnight ("7 AM–1 AM").
  if (close <= open) close += MINUTES_PER_DAY;
  return [{ open, close }];
}

/**
 * The scrape's `open_hours` ({ Monday: ["8 AM–6 PM"], … }) → periods, or null
 * when any day is missing or unreadable.
 */
export function parseWeeklyHours(
  hours: Record<string, string[]> | null | undefined,
): OpeningPeriod[] | null {
  if (!hours) return null;
  const periods: OpeningPeriod[] = [];
  for (const [day, name] of DAY_NAMES.entries()) {
    const texts = hours[name];
    if (!texts?.length) return null;
    for (const text of texts) {
      const parsed = parseDayHours(text);
      if (parsed === null) return null;
      periods.push(...parsed.map((p) => ({ day, ...p })));
    }
  }
  return periods;
}

/** Day of week and minutes after midnight in Chiang Mai at `date`. */
export function chiangMaiClock(date: Date): { day: number; minute: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    weekday: 'long',
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(date);
  const part = (type: string) => parts.find((p) => p.type === type)?.value;
  const day = DAY_NAMES.indexOf(part('weekday') as (typeof DAY_NAMES)[number]);
  return { day, minute: Number(part('hour')) * 60 + Number(part('minute')) };
}

/** Is a café with these periods open at `date`? */
export function isOpenAt(periods: OpeningPeriod[], date: Date): boolean {
  const { day, minute } = chiangMaiClock(date);
  const yesterday = (day + 6) % 7;
  return periods.some(
    (p) =>
      (p.day === day && p.open <= minute && minute < p.close) ||
      // Still open from last night: "7 AM–1 AM" yesterday at 00:30 today.
      (p.day === yesterday && minute + MINUTES_PER_DAY < p.close),
  );
}

/** MongoDB filter matching the cafés open at `date` (same rule as isOpenAt). */
export function openAtFilter(date: Date) {
  const { day, minute } = chiangMaiClock(date);
  return {
    openingHours: {
      $elemMatch: {
        $or: [
          { day, open: { $lte: minute }, close: { $gt: minute } },
          { day: (day + 6) % 7, close: { $gt: minute + MINUTES_PER_DAY } },
        ],
      },
    },
  };
}
