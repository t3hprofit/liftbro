/**
 * Derived numbers for the History tab: personal records, a 12-week
 * consistency grid and the headline tiles. Pure functions over the Store.
 */

import { exerciseKey, type Store, type Workout, type WorkoutSet } from "./storage";

type Best = { weight: number; reps: number; seconds: number };

function beats(set: WorkoutSet, best: Best): boolean {
  if (set.seconds != null) return set.seconds > best.seconds;
  if (set.weight > best.weight) return true;
  return set.weight === best.weight && set.reps > best.reps;
}

function raise(best: Best, set: WorkoutSet): Best {
  if (set.seconds != null) return { ...best, seconds: Math.max(best.seconds, set.seconds) };
  if (set.weight > best.weight) return { ...best, weight: set.weight, reps: set.reps };
  if (set.weight === best.weight) return { ...best, reps: Math.max(best.reps, set.reps) };
  return best;
}

function chronological(store: Store): Workout[] {
  return [...store.workouts].sort((a, b) => a.startedAt.localeCompare(b.startedAt));
}

/**
 * Ids of sets that were a personal record when logged: heavier than any
 * earlier set of that exercise, or more reps at the same top weight, or
 * longer for timed work. The first session of an exercise never counts —
 * you need something to beat. Covers finished history and, if present, the
 * active session (so PRs show up live while you lift).
 */
export function prSetIds(store: Store): Set<string> {
  const prs = new Set<string>();
  const best = new Map<string, Best>();
  const workouts = chronological(store);
  if (store.activeWorkout) workouts.push(store.activeWorkout);
  for (const w of workouts) {
    const seenBefore = new Set(best.keys());
    for (const e of w.exercises) {
      const key = exerciseKey(e.name);
      for (const set of e.sets) {
        const b = best.get(key) ?? { weight: -1, reps: 0, seconds: 0 };
        if (seenBefore.has(key) && beats(set, b)) prs.add(set.id);
        best.set(key, raise(b, set));
      }
    }
  }
  return prs;
}

/** How many of a workout's sets were PRs. */
export function prCount(store: Store, workout: Workout): number {
  const prs = prSetIds(store);
  return workout.exercises.reduce(
    (n, e) => n + e.sets.filter((s) => prs.has(s.id)).length,
    0
  );
}

/** Local calendar date as YYYY-MM-DD. */
export function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Monday of the week containing `d`. */
function startOfWeek(d: Date): Date {
  const s = startOfDay(d);
  const offset = (s.getDay() + 6) % 7; // Mon=0 … Sun=6
  s.setDate(s.getDate() - offset);
  return s;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export type GridDay = {
  key: string;
  /** Workouts finished that day. */
  count: number;
  today: boolean;
  future: boolean;
};

/**
 * The last `weeks` weeks as Monday-first columns, ending with the current
 * week. Days after today are marked `future` so the grid stays rectangular.
 */
export function consistencyGrid(store: Store, now = new Date(), weeks = 12): GridDay[][] {
  const counts = new Map<string, number>();
  for (const w of store.workouts) {
    const k = dayKey(new Date(w.startedAt));
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const todayKey = dayKey(now);
  const first = addDays(startOfWeek(now), -7 * (weeks - 1));
  const grid: GridDay[][] = [];
  for (let wk = 0; wk < weeks; wk++) {
    const col: GridDay[] = [];
    for (let d = 0; d < 7; d++) {
      const date = addDays(first, wk * 7 + d);
      const key = dayKey(date);
      col.push({
        key,
        count: counts.get(key) ?? 0,
        today: key === todayKey,
        future: key > todayKey,
      });
    }
    grid.push(col);
  }
  return grid;
}

export type Summary = {
  thisWeek: number;
  /** Consecutive weeks, ending with this week or last, with at least one workout. */
  weekStreak: number;
  totalWorkouts: number;
  /** Σ weight × reps over all history, in lb. */
  totalVolume: number;
};

export function summary(store: Store, now = new Date()): Summary {
  const weekOf = (iso: string) => dayKey(startOfWeek(new Date(iso)));
  const weeks = new Set(store.workouts.map((w) => weekOf(w.startedAt)));
  const thisWeekKey = dayKey(startOfWeek(now));
  const thisWeek = store.workouts.filter((w) => weekOf(w.startedAt) === thisWeekKey).length;

  // Streak counts back from this week; an empty current week doesn't break
  // it yet (the week isn't over), so start from last week in that case.
  let cursor = startOfWeek(now);
  if (!weeks.has(dayKey(cursor))) cursor = addDays(cursor, -7);
  let weekStreak = 0;
  while (weeks.has(dayKey(cursor))) {
    weekStreak++;
    cursor = addDays(cursor, -7);
  }

  const totalVolume = store.workouts.reduce(
    (t, w) =>
      t + w.exercises.reduce((e, ex) => e + ex.sets.reduce((s, x) => s + x.weight * x.reps, 0), 0),
    0
  );
  return { thisWeek, weekStreak, totalWorkouts: store.workouts.length, totalVolume };
}
