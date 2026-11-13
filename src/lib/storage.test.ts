import { describe, expect, it } from "vitest";
import {
  addExercise,
  addSet,
  cancelWorkout,
  deleteWorkout,
  emptyStore,
  exerciseNameSuggestions,
  filterExerciseNames,
  finishWorkout,
  loadStore,
  recentExerciseNames,
  removeExercise,
  removeSet,
  saveStore,
  SEED_EXERCISES,
  startWorkout,
  workoutSetCount,
  workoutVolume,
  type Store,
} from "./storage";

function storeWithLoggedSets(): Store {
  let s = startWorkout(emptyStore(), "2026-11-12T18:00:00.000Z");
  s = addExercise(s, "Bench Press");
  const benchId = s.activeWorkout!.exercises[0].id;
  s = addSet(s, benchId, 135, 5);
  s = addSet(s, benchId, 145, 3);
  return s;
}

describe("workout lifecycle", () => {
  it("starts a workout with no exercises", () => {
    const s = startWorkout(emptyStore(), "2026-11-12T18:00:00.000Z");
    expect(s.activeWorkout).not.toBeNull();
    expect(s.activeWorkout!.exercises).toEqual([]);
    expect(s.activeWorkout!.startedAt).toBe("2026-11-12T18:00:00.000Z");
  });

  it("does not start a second workout while one is active", () => {
    const s = startWorkout(emptyStore());
    const again = startWorkout(s);
    expect(again.activeWorkout!.id).toBe(s.activeWorkout!.id);
  });

  it("finishes a workout into history with finishedAt", () => {
    const s = finishWorkout(storeWithLoggedSets(), "2026-11-12T19:00:00.000Z");
    expect(s.activeWorkout).toBeNull();
    expect(s.workouts).toHaveLength(1);
    expect(s.workouts[0].finishedAt).toBe("2026-11-12T19:00:00.000Z");
    expect(s.workouts[0].exercises[0].sets).toHaveLength(2);
  });

  it("discards an empty session instead of saving junk", () => {
    const s = finishWorkout(startWorkout(emptyStore()));
    expect(s.activeWorkout).toBeNull();
    expect(s.workouts).toHaveLength(0);
  });

  it("drops exercises with zero sets on finish", () => {
    let s = storeWithLoggedSets();
    s = addExercise(s, "Squat"); // never logged
    s = finishWorkout(s);
    expect(s.workouts[0].exercises).toHaveLength(1);
    expect(s.workouts[0].exercises[0].name).toBe("Bench Press");
  });

  it("cancels the active workout without touching history", () => {
    const s = cancelWorkout(storeWithLoggedSets());
    expect(s.activeWorkout).toBeNull();
    expect(s.workouts).toHaveLength(0);
  });

  it("deletes a workout from history", () => {
    const s = finishWorkout(storeWithLoggedSets());
    const emptied = deleteWorkout(s, s.workouts[0].id);
    expect(emptied.workouts).toHaveLength(0);
  });
});

describe("sets and exercises", () => {
  it("adds and removes sets", () => {
    let s = storeWithLoggedSets();
    const exercise = s.activeWorkout!.exercises[0];
    expect(exercise.sets).toHaveLength(2);
    s = removeSet(s, exercise.id, exercise.sets[0].id);
    expect(s.activeWorkout!.exercises[0].sets).toHaveLength(1);
    expect(s.activeWorkout!.exercises[0].sets[0].weight).toBe(145);
  });

  it("rejects invalid sets", () => {
    let s = startWorkout(emptyStore());
    s = addExercise(s, "Squat");
    const id = s.activeWorkout!.exercises[0].id;
    expect(addSet(s, id, NaN, 5).activeWorkout!.exercises[0].sets).toHaveLength(0);
    expect(addSet(s, id, -10, 5).activeWorkout!.exercises[0].sets).toHaveLength(0);
    expect(addSet(s, id, 100, 0).activeWorkout!.exercises[0].sets).toHaveLength(0);
    expect(addSet(s, id, 100, 2.5).activeWorkout!.exercises[0].sets).toHaveLength(0);
  });

  it("allows zero weight for bodyweight work", () => {
    let s = startWorkout(emptyStore());
    s = addExercise(s, "Pull-Up");
    const id = s.activeWorkout!.exercises[0].id;
    s = addSet(s, id, 0, 10);
    expect(s.activeWorkout!.exercises[0].sets).toHaveLength(1);
  });

  it("ignores blank exercise names", () => {
    const s = addExercise(startWorkout(emptyStore()), "   ");
    expect(s.activeWorkout!.exercises).toHaveLength(0);
  });

  it("removes an exercise with its sets", () => {
    let s = storeWithLoggedSets();
    s = removeExercise(s, s.activeWorkout!.exercises[0].id);
    expect(s.activeWorkout!.exercises).toHaveLength(0);
  });
});

describe("derived stats", () => {
  it("computes volume as Σ weight × reps", () => {
    const s = storeWithLoggedSets();
    expect(workoutVolume(s.activeWorkout!)).toBe(135 * 5 + 145 * 3);
  });

  it("counts sets across exercises", () => {
    let s = storeWithLoggedSets();
    s = addExercise(s, "Squat");
    const squatId = s.activeWorkout!.exercises[1].id;
    s = addSet(s, squatId, 225, 5);
    expect(workoutSetCount(s.activeWorkout!)).toBe(3);
  });
});

describe("exercise suggestions", () => {
  it("includes seeds plus logged names, deduped case-insensitively", () => {
    let s = startWorkout(emptyStore());
    s = addExercise(s, "bench press"); // same as seed, different case
    s = addExercise(s, "Zercher Squat"); // custom
    const suggestions = exerciseNameSuggestions(s);
    expect(suggestions).toContain("Zercher Squat");
    expect(
      suggestions.filter((n) => n.toLowerCase() === "bench press")
    ).toHaveLength(1);
    expect(suggestions.length).toBe(SEED_EXERCISES.length + 1);
  });
});

describe("persistence", () => {
  it("round-trips through localStorage", () => {
    const s = finishWorkout(storeWithLoggedSets());
    saveStore(s);
    expect(loadStore()).toEqual(s);
  });

  it("returns an empty store for missing or corrupt data", () => {
    expect(loadStore()).toEqual(emptyStore());
    localStorage.setItem("liftbro.v1", "not json {");
    expect(loadStore()).toEqual(emptyStore());
    localStorage.setItem("liftbro.v1", JSON.stringify({ version: 99 }));
    expect(loadStore()).toEqual(emptyStore());
  });
});

describe("exercise picker helpers", () => {
  function finished(names: string[], day: number): Store {
    let s = startWorkout(emptyStore(), `2026-11-${String(day).padStart(2, "0")}T18:00:00.000Z`);
    for (const n of names) {
      s = addExercise(s, n);
      const ex = s.activeWorkout!.exercises.at(-1)!;
      s = addSet(s, ex.id, 100, 5);
    }
    return finishWorkout(s);
  }

  it("lists recent exercises newest first, deduped, capped", () => {
    let s = finished(["Squat", "Leg Press"], 1);
    s = { ...s, workouts: [...s.workouts, ...finished(["Bench Press", "squat"], 2).workouts] };
    expect(recentExerciseNames(s)).toEqual(["Bench Press", "squat", "Leg Press"]);
    expect(recentExerciseNames(s, 1)).toEqual(["Bench Press"]);
  });

  it("counts the active session as most recent", () => {
    let s = finished(["Squat"], 1);
    s = startWorkout(s);
    s = addExercise(s, "Deadlift");
    expect(recentExerciseNames(s)).toEqual(["Deadlift", "Squat"]);
  });

  it("returns nothing recent for a fresh store", () => {
    expect(recentExerciseNames(emptyStore())).toEqual([]);
  });

  it("filters by every token, case-insensitively", () => {
    const names = ["Bench Press", "Incline Bench Press", "Leg Press", "Squat"];
    expect(filterExerciseNames(names, "")).toEqual(names);
    expect(filterExerciseNames(names, "  ")).toEqual(names);
    expect(filterExerciseNames(names, "press")).toEqual([
      "Bench Press",
      "Incline Bench Press",
      "Leg Press",
    ]);
    expect(filterExerciseNames(names, "inc bench")).toEqual(["Incline Bench Press"]);
    expect(filterExerciseNames(names, "zzz")).toEqual([]);
  });
});
