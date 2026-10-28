"use client";

import type { OpeningPeriod } from "@/lib/cafes";
import { DAY_NAMES, chiangMaiClock, dayHoursText, openStatus, useNow } from "@/lib/opening-hours";

/** "● Open · Closes 18:00" / "Closed · Opens Mon 08:00". Nothing when hours are unknown. */
export function OpenStatusText({ periods }: { periods: OpeningPeriod[] | null }) {
  const now = useNow();
  if (!periods || !now) return null;
  const status = openStatus(periods, now);
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`h-1.5 w-1.5 rounded-full ${status.open ? "bg-moss" : "bg-muted"}`}
        aria-hidden
      />
      <span className={status.open ? "font-medium text-moss" : "text-ink-soft"}>
        {status.open ? "Open" : "Closed"}
      </span>
      {status.detail && <span>· {status.detail}</span>}
    </span>
  );
}

/** The week's hours, Monday first, with today marked. Chiang Mai time. */
export function WeeklyHours({ periods }: { periods: OpeningPeriod[] }) {
  const now = useNow();
  const today = now ? chiangMaiClock(now).day : null;
  const week = [1, 2, 3, 4, 5, 6, 0];
  return (
    <ul className="space-y-1 text-sm">
      {week.map((day) => (
        <li
          key={day}
          className={`flex justify-between gap-6 ${day === today ? "font-medium text-ink" : "text-ink-soft"}`}
        >
          <span>
            {DAY_NAMES[day]}
            {day === today && <span className="sr-only"> (today)</span>}
          </span>
          <span className="text-right tabular-nums">{dayHoursText(periods, day)}</span>
        </li>
      ))}
    </ul>
  );
}
