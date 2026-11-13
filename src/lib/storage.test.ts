import { describe, expect, it } from "vitest";
import {
  addExercise,
  addSet,
  addProgram,
  cancelWorkout,
  createPlan,
  deletePlan,
  deleteWorkout,
  emptyStore,
  exerciseNameSuggestions,
  filterExerciseNames,
  finishWorkout,
  lastPerformance,
  LIBRARY_VERSION,
  loadStore,
  newPlanExercise,
  nextPlan,
  PROGRAM_LIBRARY,
  recentExerciseNames,
  removeExercise,
  removeSet,
  saveStore,
  SEED_EXERCISES,
  starterPlans,
  startWorkout,
  syncLibrary,
  updatePlan,
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
    const fresh = (s: Store) =>
      s.workouts.length === 0 &&
      s.activeWorkout === null &&
      s.plans.map((p) => p.name).join() === starterPlans().map((p) => p.name).join();
    expect(fresh(loadStore())).toBe(true);
    localStorage.setItem("liftbro.v1", "not json {");
    expect(fresh(loadStore())).toBe(true);
    localStorage.setItem("liftbro.v1", JSON.stringify({ version: 99 }));
    expect(fresh(loadStore())).toBe(true);
  });

  it("gives pre-plans data the whole library", () => {
    localStorage.setItem(
      "liftbro.v1",
      JSON.stringify({ version: 1, workouts: [], activeWorkout: null })
    );
    const s = loadStore();
    expect(s.plans.length).toBe(starterPlans().length);
    expect(s.libraryVersion).toBe(LIBRARY_VERSION);
  });

  it("adds only new programs to first-release data, keeping deletions", () => {
    // First plans release: PPL + Upper/Lower, user deleted Upper/Lower, no libraryVersion.
    const v1 = { ...emptyStore(), plans: [] as Store["plans"] };
    const ppl = addProgram(v1, "ppl");
    localStorage.setItem(
      "liftbro.v1",
      JSON.stringify({ version: 1, workouts: [], activeWorkout: null, plans: ppl.plans })
    );
    const s = loadStore();
    const names = s.plans.map((p) => p.name);
    expect(names).toContain("Push Day");
    expect(names).not.toContain("Upper"); // since: 1, already offered
    expect(names).toContain("Full Body"); // since: 2, new
    expect(names).toContain("GZCLP Day 1");
    expect(names).toContain("Arnold: Legs");
    expect(s.libraryVersion).toBe(LIBRARY_VERSION);
  });

  it("leaves an up-to-date emptied list alone", () => {
    localStorage.setItem(
      "liftbro.v1",
      JSON.stringify({
        version: 1,
        workouts: [],
        activeWorkout: null,
        plans: [],
        libraryVersion: LIBRARY_VERSION,
      })
    );
    expect(loadStore().plans).toEqual([]);
    expect(syncLibrary(loadStore()).plans).toEqual([]);
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

describe("plans", () => {
  it("ships with the whole library, every plan with valid targets", () => {
    const s = emptyStore();
    const expected = PROGRAM_LIBRARY.flatMap((p) => p.plans.map((d) => d.name));
    expect(s.plans.map((p) => p.name)).toEqual(expected);
    expect(s.plans.map((p) => p.name)).toContain("Push Day");
    for (const p of s.plans) {
      expect(p.programId).toBeTruthy();
      expect(p.exercises.length).toBeGreaterThan(0);
      for (const e of p.exercises) {
        expect(e.target.sets).toBeGreaterThan(0);
        expect(e.target.reps).toBeGreaterThan(0);
      }
    }
  });

  it("creates, updates and deletes a plan", () => {
    let s = createPlan({ ...emptyStore(), plans: [] }, "  Arms  ", [
      newPlanExercise("Dumbbell Curl", { sets: 3, reps: 12 }),
      newPlanExercise("   ", { sets: 3, reps: 12 }), // blank → dropped
      newPlanExercise("Skullcrusher", { sets: 0, reps: 12 }), // bad target → dropped
    ]);
    expect(s.plans).toHaveLength(1);
    expect(s.plans[0].name).toBe("Arms");
    expect(s.plans[0].exercises.map((e) => e.name)).toEqual(["Dumbbell Curl"]);

    const renamed = { ...s.plans[0], name: "Gun Show" };
    s = updatePlan(s, renamed);
    expect(s.plans[0].name).toBe("Gun Show");

    s = deletePlan(s, s.plans[0].id);
    expect(s.plans).toHaveLength(0);
  });

  it("ignores blank names and unknown ids", () => {
    const base = { ...emptyStore(), plans: [] as Store["plans"] };
    expect(createPlan(base, "   ", [])).toBe(base);
    expect(updatePlan(base, { id: "nope", name: "X", exercises: [] })).toBe(base);
  });

  it("starts a workout from a plan with exercises and targets pre-loaded", () => {
    const base = emptyStore();
    const push = base.plans.find((p) => p.name === "Push Day")!;
    const s = startWorkout(base, "2026-11-12T18:00:00.000Z", push);
    const w = s.activeWorkout!;
    expect(w.planId).toBe(push.id);
    expect(w.planName).toBe("Push Day");
    expect(w.exercises.map((e) => e.name)).toEqual(push.exercises.map((e) => e.name));
    expect(w.exercises[0].target).toEqual(push.exercises[0].target);
    expect(w.exercises[0].sets).toEqual([]);
    // ids are fresh, not shared with the plan
    expect(w.exercises[0].id).not.toBe(push.exercises[0].id);
  });

  it("keeps plan name in history after the plan is deleted", () => {
    const base = emptyStore();
    const push = base.plans.find((p) => p.name === "Push Day")!;
    let s = startWorkout(base, "2026-11-12T18:00:00.000Z", push);
    s = addSet(s, s.activeWorkout!.exercises[0].id, 135, 5);
    s = finishWorkout(s);
    s = deletePlan(s, push.id);
    expect(s.workouts[0].planName).toBe("Push Day");
  });

  it("includes plan exercise names in suggestions", () => {
    const s = createPlan({ ...emptyStore(), plans: [] }, "Odd", [
      newPlanExercise("Zercher Squat"),
    ]);
    expect(exerciseNameSuggestions(s)).toContain("Zercher Squat");
  });
});

describe("library and guidance", () => {
  const byName = (s: Store, name: string) => s.plans.find((p) => p.name === name)!;

  function doPlan(s: Store, name: string, day: string): Store {
    const plan = byName(s, name);
    let next = startWorkout(s, `2026-11-${day}T18:00:00.000Z`, plan);
    next = addSet(next, next.activeWorkout!.exercises[0].id, 100, 5);
    return finishWorkout(next);
  }

  it("addProgram adds a program's plans and skips names already present", () => {
    const base = { ...emptyStore(), plans: [] as Store["plans"] };
    let s = addProgram(base, "gzclp");
    expect(s.plans.map((p) => p.name)).toEqual([
      "GZCLP Day 1",
      "GZCLP Day 2",
      "GZCLP Day 3",
      "GZCLP Day 4",
    ]);
    expect(s.plans[0].programId).toBe("gzclp");
    s = deletePlan(s, s.plans[1].id);
    s = addProgram(s, "gzclp"); // only Day 2 comes back
    expect(s.plans).toHaveLength(4);
    expect(addProgram(s, "nope")).toBe(s);
  });

  it("pull day no longer asks for pull-ups", () => {
    const pull = byName(emptyStore(), "Pull Day");
    expect(pull.exercises.map((e) => e.name)).not.toContain("Pull-Up");
    expect(pull.exercises.map((e) => e.name)).toContain("Lat Pulldown");
  });

  it("suggests the next day in a program, wrapping at the end", () => {
    let s = emptyStore();
    expect(nextPlan(s)).toBeNull();
    s = doPlan(s, "GZCLP Day 1", "01");
    expect(nextPlan(s)!.name).toBe("GZCLP Day 2");
    s = doPlan(s, "GZCLP Day 4", "02");
    expect(nextPlan(s)!.name).toBe("GZCLP Day 1");
  });

  it("suggests the same plan for single-day programs and custom plans", () => {
    let s = doPlan(emptyStore(), "Full Body", "01");
    expect(nextPlan(s)!.name).toBe("Full Body");
    s = createPlan(s, "Arms", [newPlanExercise("Dumbbell Curl")]);
    s = doPlan(s, "Arms", "02");
    expect(nextPlan(s)!.name).toBe("Arms");
  });

  it("suggests nothing after freestyle or when the plan is gone", () => {
    let s = startWorkout(emptyStore(), "2026-11-01T18:00:00.000Z");
    s = addExercise(s, "Squat");
    s = addSet(s, s.activeWorkout!.exercises[0].id, 100, 5);
    s = finishWorkout(s);
    expect(nextPlan(s)).toBeNull();
    s = doPlan(s, "Full Body", "02");
    s = deletePlan(s, byName(s, "Full Body").id);
    expect(nextPlan(s)).toBeNull();
  });

  it("finds the last logged sets for an exercise, case-insensitively", () => {
    let s = startWorkout(emptyStore(), "2026-11-01T18:00:00.000Z");
    s = addExercise(s, "Bench Press");
    const id = s.activeWorkout!.exercises[0].id;
    s = addSet(s, id, 135, 8);
    s = addSet(s, id, 140, 6);
    s = finishWorkout(s);
    expect(lastPerformance(s, "bench press")!.sets.map((x) => x.weight)).toEqual([135, 140]);
    expect(lastPerformance(s, "bench press")!.date).toBe("2026-11-01T18:00:00.000Z");
    expect(lastPerformance(s, "Squat")).toBeNull();
    // the active workout doesn't count — only finished history
    s = startWorkout(s);
    s = addExercise(s, "Squat");
    expect(lastPerformance(s, "Squat")).toBeNull();
  });
});
