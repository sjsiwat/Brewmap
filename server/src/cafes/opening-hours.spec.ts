import {
  chiangMaiClock,
  isOpenAt,
  parseDayHours,
  parseWeeklyHours,
  type OpeningPeriod,
} from './opening-hours';

const week = (text: string) =>
  Object.fromEntries(
    [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ].map((day) => [day, [text]]),
  );

// Chiang Mai is UTC+7 all year: 2026-10-28 is a Wednesday (day 3).
const chiangMai = (iso: string) => new Date(`${iso}+07:00`);

describe('parseDayHours', () => {
  it('reads the formats in the Google Maps scrape', () => {
    expect(parseDayHours('8 AM–6 PM')).toEqual([{ open: 480, close: 1080 }]);
    expect(parseDayHours('8:30 AM–5:30 PM')).toEqual([
      { open: 510, close: 1050 },
    ]);
    // The start takes the end's AM/PM when it leaves it out.
    expect(parseDayHours('12–10 PM')).toEqual([{ open: 720, close: 1320 }]);
    expect(parseDayHours('Closed')).toEqual([]);
    expect(parseDayHours('Open 24 hours')).toEqual([{ open: 0, close: 1440 }]);
  });

  it('keeps closing after midnight on the same day, past 1440', () => {
    expect(parseDayHours('8 AM–12 AM')).toEqual([{ open: 480, close: 1440 }]);
    expect(parseDayHours('7 AM–1 AM')).toEqual([{ open: 420, close: 1500 }]);
    expect(parseDayHours('6 PM–12 AM')).toEqual([{ open: 1080, close: 1440 }]);
  });

  it('returns null for text it cannot read, never a guess', () => {
    expect(parseDayHours('Hours might differ')).toBeNull();
    expect(parseDayHours('13 PM–2 PM')).toBeNull();
    expect(parseDayHours('8–6')).toBeNull();
  });
});

describe('parseWeeklyHours', () => {
  it('turns every day into periods; closed days have none', () => {
    const periods = parseWeeklyHours({
      ...week('8 AM–6 PM'),
      Monday: ['Closed'],
      Friday: ['7 AM–12 PM', '1–5 PM'],
    })!;
    expect(periods.filter((p) => p.day === 1)).toEqual([]);
    expect(periods.filter((p) => p.day === 5)).toEqual([
      { day: 5, open: 420, close: 720 },
      { day: 5, open: 780, close: 1020 },
    ]);
    expect(periods.filter((p) => p.day === 0)).toEqual([
      { day: 0, open: 480, close: 1080 },
    ]);
  });

  it('is null when a day is missing or unreadable', () => {
    const { Tuesday, ...missing } = week('8 AM–6 PM');
    expect(Tuesday).toBeDefined();
    expect(parseWeeklyHours(missing)).toBeNull();
    expect(
      parseWeeklyHours({ ...week('8 AM–6 PM'), Sunday: ['soon'] }),
    ).toBeNull();
    expect(parseWeeklyHours(null)).toBeNull();
  });
});

describe('isOpenAt', () => {
  const dayShift: OpeningPeriod[] = [{ day: 3, open: 480, close: 1080 }];
  const lateTuesday: OpeningPeriod[] = [{ day: 2, open: 420, close: 1500 }];

  it('uses Chiang Mai time', () => {
    expect(chiangMaiClock(new Date('2026-10-28T01:00:00Z'))).toEqual({
      day: 3,
      minute: 480,
    });
  });

  it('is open from the opening minute until just before closing', () => {
    expect(isOpenAt(dayShift, chiangMai('2026-10-28T07:59:00'))).toBe(false);
    expect(isOpenAt(dayShift, chiangMai('2026-10-28T08:00:00'))).toBe(true);
    expect(isOpenAt(dayShift, chiangMai('2026-10-28T17:59:00'))).toBe(true);
    expect(isOpenAt(dayShift, chiangMai('2026-10-28T18:00:00'))).toBe(false);
  });

  it("counts last night's hours that run past midnight", () => {
    expect(isOpenAt(lateTuesday, chiangMai('2026-10-28T00:30:00'))).toBe(true);
    expect(isOpenAt(lateTuesday, chiangMai('2026-10-28T01:00:00'))).toBe(false);
  });
});
