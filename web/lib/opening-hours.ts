import { useSyncExternalStore } from "react";
import type { OpeningPeriod } from "@/lib/cafes";
import { format } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/en";

type HoursText = Dictionary["hours"];

/** Intl's English weekday names, to find the day number; display names come from the dictionary. */
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MINUTES_PER_DAY = 24 * 60;

/** Day of week and minutes after midnight in Chiang Mai, whatever the visitor's time zone. */
export function chiangMaiClock(date: Date): { day: number; minute: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Bangkok",
    weekday: "long",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(date);
  const part = (type: string) => parts.find((p) => p.type === type)?.value;
  return {
    day: WEEKDAYS.indexOf(part("weekday") ?? ""),
    minute: Number(part("hour")) * 60 + Number(part("minute")),
  };
}

/** 480 → "08:00"; 1440 and later wrap past midnight ("00:00", "01:00"). */
export function formatMinutes(minutes: number): string {
  const m = minutes % MINUTES_PER_DAY;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/** One day's hours, e.g. "08:00–18:00", "07:00–12:00, 13:00–17:00", "Closed", "Open 24 hours". */
export function dayHoursText(periods: OpeningPeriod[], day: number, t: HoursText): string {
  const today = periods.filter((p) => p.day === day).sort((a, b) => a.open - b.open);
  if (today.length === 0) return t.closed;
  if (today.length === 1 && today[0].open === 0 && today[0].close >= MINUTES_PER_DAY) return t.open24;
  return today.map((p) => `${formatMinutes(p.open)}–${formatMinutes(p.close)}`).join(", ");
}

export interface OpenStatus {
  open: boolean;
  /** "Closes 18:00", "Opens 08:00", "Opens Mon 08:00", "Open 24 hours"; null when it never opens. */
  detail: string | null;
}

/** Open or closed at `date`, and when that changes next. Same rule as the API's openNow. */
export function openStatus(periods: OpeningPeriod[], date: Date, t: HoursText): OpenStatus {
  const { day, minute } = chiangMaiClock(date);
  // Each period as minutes from the start of today, over the next 7 days. The
  // same period a week earlier covers "still open from last night".
  const week = periods.flatMap((p) => {
    const base = ((p.day - day + 7) % 7) * MINUTES_PER_DAY;
    return [base, base - 7 * MINUTES_PER_DAY].map((b) => ({ start: b + p.open, end: b + p.close, day: p.day }));
  });
  const current = week.find((s) => s.start <= minute && minute < s.end);
  if (current) {
    if (current.end - current.start >= MINUTES_PER_DAY && periods.length === 7) {
      return { open: true, detail: t.open24 };
    }
    return { open: true, detail: format(t.closes, { time: formatMinutes(current.end) }) };
  }
  const next = week.filter((s) => s.start > minute).sort((a, b) => a.start - b.start)[0];
  if (!next) return { open: false, detail: null };
  const sameDay = next.start < MINUTES_PER_DAY;
  const time = formatMinutes(next.start);
  return {
    open: false,
    detail: sameDay ? format(t.opens, { time }) : format(t.opensOn, { day: t.daysShort[next.day], time }),
  };
}

const subscribeMinute = (onChange: () => void) => {
  const timer = setInterval(onChange, 30_000);
  return () => clearInterval(timer);
};
const minuteSnapshot = () => Math.floor(Date.now() / 60_000);
const noSnapshot = () => null;

/** The current time, updated every minute; null while rendering on the server. */
export function useNow(): Date | null {
  const minute = useSyncExternalStore(subscribeMinute, minuteSnapshot, noSnapshot);
  return minute === null ? null : new Date(minute * 60_000);
}
