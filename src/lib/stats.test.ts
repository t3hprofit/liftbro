import { describe, expect, it } from "vitest";
import { consistencyGrid, dayKey, prCount, prSetIds, summary } from "./stats";
import {
  addExercise,
  addSet,
  addTimedSet,
  emptyStore,
  finishWorkout,
  startWorkout,
  type Store,
} from "./storage";

/** Finish a workout on `iso` with [exercise, [[weight, reps] | seconds]...] */
function session(
  s: Store,
  iso: string,
  exercises: [string, ([number, number] | number)[]][]
): Store {
  let next = startWorkout(s, iso);
  for (const [name, sets] of exercises) {
    next = addExercise(next, name);
    const id = next.activeWorkout!.exercises.at(-1)!.id;
    for (const set of sets) {
      next =
        typeof set === "number"
          ? addTimedSet(next, id, set)
          : addSet(next, id, set[0], set[1]);
    }
  }
  return finishWorkout(next, iso);
}

const base = () => ({ ...emptyStore(), plans: [] as Store["plans"] });

describe("personal records", () => {
  it("never flags an exercise's first session, then flags heavier sets", () => {
    let s = session(base(), "2026-11-02T18:00:00.000Z", [["Bench Press", [[135, 5], [135, 5]]]]);
    expect(prSetIds(s).size).toBe(0);
    s = session(s, "2026-11-05T18:00:00.000Z", [["bench press", [[135, 5], [140, 3], [145, 1]]]]);
    const w = s.workouts[1];
    const prs = prSetIds(s);
    expect(prs.has(w.exercises[0].sets[0].id)).toBe(false); // same as before
    expect(prs.has(w.exercises[0].sets[1].id)).toBe(true);
    expect(prs.has(w.exercises[0].sets[2].id)).toBe(true);
    expect(prCount(s, w)).toBe(2);
  });

  it("counts more reps at the same top weight, and bodyweight rep PRs", () => {
    let s = session(base(), "2026-11-02T18:00:00.000Z", [["Pull-Up", [[0, 5]]]]);
    s = session(s, "2026-11-05T18:00:00.000Z", [["Pull-Up", [[0, 6], [0, 4]]]]);
    const sets = s.workouts[1].exercises[0].sets;
    expect(prSetIds(s).has(sets[0].id)).toBe(true);
    expect(prSetIds(s).has(sets[1].id)).toBe(false);
  });

  it("handles timed exercises by duration", () => {
    let s = session(base(), "2026-11-02T18:00:00.000Z", [["Plank", [45]]]);
    s = session(s, "2026-11-05T18:00:00.000Z", [["Plank", [40, 60]]]);
    const sets = s.workouts[1].exercises[0].sets;
    expect(prSetIds(s).has(sets[0].id)).toBe(false);
    expect(prSetIds(s).has(sets[1].id)).toBe(true);
  });

  it("flags PRs live in the active session", () => {
    let s = session(base(), "2026-11-02T18:00:00.000Z", [["Squat", [[185, 5]]]]);
    s = startWorkout(s, "2026-11-05T18:00:00.000Z");
    s = addExercise(s, "Squat");
    s = addSet(s, s.activeWorkout!.exercises[0].id, 195, 5);
    expect(prSetIds(s).has(s.activeWorkout!.exercises[0].sets[0].id)).toBe(true);
  });

  it("uses chronological order even if history is stored out of order", () => {
    const later = session(base(), "2026-11-05T18:00:00.000Z", [["Squat", [[200, 5]]]]);
    const earlier = session(base(), "2026-11-02T18:00:00.000Z", [["Squat", [[185, 5]]]]);
    const s = { ...base(), workouts: [...later.workouts, ...earlier.workouts] };
    expect(prSetIds(s).has(later.workouts[0].exercises[0].sets[0].id)).toBe(true);
    expect(prSetIds(s).has(earlier.workouts[0].exercises[0].sets[0].id)).toBe(false);
  });
});

describe("consistency grid", () => {
  const now = new Date(2026, 10, 23, 12); // Mon Nov 23 2026, local

  it("is 12 Monday-first columns ending in the current week", () => {
    const grid = consistencyGrid(base(), now);
    expect(grid).toHaveLength(12);
    expect(grid.every((c) => c.length === 7)).toBe(true);
    expect(grid[11][0].key).toBe("2026-11-23");
    expect(grid[11][0].today).toBe(true);
    expect(grid[11][1].future).toBe(true);
    expect(grid[0][0].key).toBe(dayKey(new Date(2026, 8, 7))); // Mon Sep 7
  });

  it("counts workouts per local day", () => {
    let s = session(base(), new Date(2026, 10, 20, 18).toISOString(), [["Squat", [[185, 5]]]]);
    s = session(s, new Date(2026, 10, 20, 7).toISOString(), [["Bench Press", [[135, 5]]]]);
    const grid = consistencyGrid(s, now);
    const fri = grid[10][4];
    expect(fri.key).toBe("2026-11-20");
    expect(fri.count).toBe(2);
    expect(grid[11][0].count).toBe(0);
  });
});

describe("summary", () => {
  const now = new Date(2026, 10, 23, 12); // Monday
  const day = (d: number, h = 18) => new Date(2026, 10, d, h).toISOString();

  it("is all zeros for a fresh store", () => {
    expect(summary(base(), now)).toEqual({
      thisWeek: 0,
      weekStreak: 0,
      totalWorkouts: 0,
      totalVolume: 0,
    });
  });

  it("counts this week, total volume and a weekly streak", () => {
    let s = session(base(), day(4), [["Squat", [[100, 10]]]]); // wk of Nov 2
    s = session(s, day(11), [["Squat", [[100, 10]]]]); // wk of Nov 9
    s = session(s, day(18), [["Plank", [60]]]); // wk of Nov 16 (timed → no volume)
    s = session(s, day(23), [["Squat", [[100, 10]]]]); // this week
    const sum = summary(s, now);
    expect(sum.thisWeek).toBe(1);
    expect(sum.totalWorkouts).toBe(4);
    expect(sum.totalVolume).toBe(3000);
    expect(sum.weekStreak).toBe(4);
  });

  it("doesn't break the streak just because this week hasn't had a session yet", () => {
    let s = session(base(), day(11), [["Squat", [[100, 10]]]]);
    s = session(s, day(18), [["Squat", [[100, 10]]]]);
    expect(summary(s, now).weekStreak).toBe(2);
    // but a gap week does
    const gapped = session(base(), day(4), [["Squat", [[100, 10]]]]);
    expect(summary(gapped, now).weekStreak).toBe(0);
  });
});
