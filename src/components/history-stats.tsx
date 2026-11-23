"use client";

import { Card, CardContent } from "@/components/ui/card";
import { formatNumber } from "@/lib/format";
import { consistencyGrid, summary, type GridDay } from "@/lib/stats";
import type { Store } from "@/lib/storage";
import { cn } from "@/lib/utils";

function Tile({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <Card>
      <CardContent className="px-3 py-3">
        <p className="text-[0.65rem] tracking-widest text-muted-foreground uppercase">{label}</p>
        <p className="display mt-0.5 text-2xl tabular-nums">
          {value}
          {unit && <span className="ml-1 text-xs text-muted-foreground">{unit}</span>}
        </p>
      </CardContent>
    </Card>
  );
}

/** Three headline numbers: sessions this week, weekly streak, lifetime volume. */
export function SummaryTiles({ store, now }: { store: Store; now?: Date }) {
  const s = summary(store, now);
  return (
    <div className="grid grid-cols-3 gap-2">
      <Tile label="This week" value={String(s.thisWeek)} unit={s.thisWeek === 1 ? "session" : "sessions"} />
      <Tile label="Streak" value={String(s.weekStreak)} unit={s.weekStreak === 1 ? "week" : "weeks"} />
      <Tile label="Lifted" value={formatNumber(s.totalVolume)} unit="lb" />
    </div>
  );
}

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

function longDate(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function dayTitle(day: GridDay): string {
  const date = longDate(day.key);
  if (day.count === 0) return `${date}: rest`;
  return `${date}: ${day.count} ${day.count === 1 ? "workout" : "workouts"}`;
}

/**
 * 12 weeks of days, Monday at the top, one dot per day, lit when you trained.
 * Single hue: trained vs not is the only thing it says.
 */
export function ConsistencyGrid({ store, now }: { store: Store; now?: Date }) {
  const grid = consistencyGrid(store, now);
  const trainedDays = grid.flat().filter((d) => d.count > 0).length;
  return (
    <Card>
      <CardContent className="px-4 py-3">
        <div className="flex items-baseline justify-between">
          <p className="text-[0.65rem] tracking-widest text-muted-foreground uppercase">
            Last 12 weeks
          </p>
          <p className="text-xs text-muted-foreground tabular-nums">
            {trainedDays} {trainedDays === 1 ? "day" : "days"} trained
          </p>
        </div>
        <div className="mt-2 flex gap-1.5">
          <div className="flex flex-col gap-1">
            {DAY_LABELS.map((l, i) => (
              <span
                key={i}
                className="flex h-3 items-center text-[0.6rem] leading-none text-muted-foreground"
                aria-hidden
              >
                {l}
              </span>
            ))}
          </div>
          <ul className="flex flex-1 justify-between" aria-label="Days trained, last 12 weeks">
            {grid.map((week, wi) => (
              <li key={wi} className="flex flex-col gap-1">
                {week.map((day) => (
                  <span
                    key={day.key}
                    title={day.future ? undefined : dayTitle(day)}
                    aria-label={day.future ? undefined : dayTitle(day)}
                    className={cn(
                      "block size-3 rounded-[3px]",
                      day.future && "bg-transparent",
                      !day.future && day.count === 0 && "bg-muted",
                      day.count === 1 && "bg-primary/70",
                      day.count > 1 && "bg-primary",
                      day.today && "ring-1 ring-foreground/60"
                    )}
                  />
                ))}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
