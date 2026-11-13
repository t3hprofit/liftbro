/**
 * LiftBro v1 data layer — localStorage only, until a database backend lands.
 *
 * All mutation helpers are pure (Store in, Store out) so they're trivially
 * testable; persistence happens in the useWorkoutStore hook.
 */

export type WorkoutSet = {
  id: string;
  /** Weight in lbs. Unit setting comes later. */
  weight: number;
  reps: number;
};

/** What a plan asks for: N sets of M reps. Weight is whatever you log. */
export type SetTarget = {
  sets: number;
  reps: number;
};

export type WorkoutExercise = {
  id: string;
  name: string;
  sets: WorkoutSet[];
  /** Present when the exercise came from a plan. */
  target?: SetTarget;
};

export type Workout = {
  id: string;
  /** ISO timestamps */
  startedAt: string;
  finishedAt?: string;
  exercises: WorkoutExercise[];
  /** Set when the workout was started from a plan. Name is snapshotted so
   *  history still reads right after the plan is renamed or deleted. */
  planId?: string;
  planName?: string;
};

export type PlanExercise = {
  id: string;
  name: string;
  target: SetTarget;
};

/** A reusable workout template, e.g. "Push Day". */
export type Plan = {
  id: string;
  name: string;
  exercises: PlanExercise[];
  /** Groups plans that cycle together: a built-in program (see
   *  PROGRAM_LIBRARY) or a user-created one (see Store.programs). */
  programId?: string;
};

/** A user-created program: a named group of plans that rotate through Next up. */
export type UserProgram = {
  id: string;
  name: string;
};

export type Store = {
  version: 1;
  /** Finished workouts, newest last (sorted on read where it matters). */
  workouts: Workout[];
  /** In-progress session — survives closing the tab mid-workout. */
  activeWorkout: Workout | null;
  /** Workout templates. Seeded from the library on first load. */
  plans: Plan[];
  /** User-created programs. Built-in ones live in PROGRAM_LIBRARY. */
  programs: UserProgram[];
  /** Highest library version whose programs have been offered to this store.
   *  Lets new built-in programs appear once for existing users. */
  libraryVersion: number;
};

const STORAGE_KEY = "liftbro.v1";

export const SEED_EXERCISES = [
  "Squat",
  "Bench Press",
  "Deadlift",
  "Overhead Press",
  "Barbell Row",
  "Incline Bench Press",
  "Romanian Deadlift",
  "Front Squat",
  "Pull-Up",
  "Chin-Up",
  "Dip",
  "Lat Pulldown",
  "Seated Cable Row",
  "Leg Press",
  "Leg Curl",
  "Leg Extension",
  "Hip Thrust",
  "Lunge",
  "Calf Raise",
  "Dumbbell Curl",
  "Hammer Curl",
  "Tricep Pushdown",
  "Skullcrusher",
  "Lateral Raise",
  "Face Pull",
  "Shrug",
  "Chest Fly",
  "Push-Up",
  "Air Squat",
  "Jump Squat",
  "Glute Bridge",
  "Burpee",
  "Mountain Climber",
  "Crunch",
  "Hanging Knee Raise",
];

type SeedPlan = { name: string; exercises: [string, number, number][] };

export type ProgramLevel = "Beginner" | "Intermediate" | "Advanced";

/** A named training program: one or more plans (days) plus a plain-English blurb. */
export type Program = {
  id: string;
  name: string;
  level: ProgramLevel;
  daysPerWeek: string;
  blurb: string;
  /** Library version that introduced this program (see LIBRARY_VERSION). */
  since: number;
  plans: SeedPlan[];
};

/**
 * Bump when adding programs. Stores below this version get the new programs
 * added once on load; deleting them afterwards sticks.
 */
export const LIBRARY_VERSION = 3;

/** Built-in programs. Order here is the order days are suggested in. */
export const PROGRAM_LIBRARY: Program[] = [
  {
    id: "full-body",
    name: "Full Body",
    level: "Beginner",
    daysPerWeek: "3",
    since: 2,
    blurb:
      "One workout, three times a week. Hits everything, nothing fancy. Start here if you're new.",
    plans: [
      {
        name: "Full Body",
        exercises: [
          ["Squat", 3, 8],
          ["Bench Press", 3, 8],
          ["Barbell Row", 3, 8],
          ["Romanian Deadlift", 3, 10],
          ["Lat Pulldown", 3, 10],
          ["Dumbbell Curl", 2, 12],
          ["Tricep Pushdown", 2, 12],
        ],
      },
    ],
  },
  {
    id: "ppl",
    name: "Push / Pull / Legs",
    level: "Intermediate",
    daysPerWeek: "3–6",
    since: 1,
    blurb:
      "Pushing muscles one day, pulling the next, legs the third. Run it once or twice a week.",
    plans: [
      {
        name: "Push Day",
        exercises: [
          ["Bench Press", 4, 6],
          ["Overhead Press", 3, 8],
          ["Incline Bench Press", 3, 10],
          ["Lateral Raise", 3, 12],
          ["Tricep Pushdown", 3, 12],
        ],
      },
      {
        name: "Pull Day",
        exercises: [
          ["Deadlift", 3, 5],
          ["Lat Pulldown", 3, 10],
          ["Barbell Row", 3, 8],
          ["Seated Cable Row", 3, 12],
          ["Face Pull", 3, 15],
          ["Dumbbell Curl", 3, 12],
        ],
      },
      {
        name: "Leg Day",
        exercises: [
          ["Squat", 4, 6],
          ["Romanian Deadlift", 3, 8],
          ["Leg Press", 3, 10],
          ["Leg Curl", 3, 12],
          ["Calf Raise", 4, 15],
        ],
      },
    ],
  },
  {
    id: "upper-lower",
    name: "Upper / Lower",
    level: "Intermediate",
    daysPerWeek: "4",
    since: 1,
    blurb: "Upper body one day, lower the next. Four days a week, two of each.",
    plans: [
      {
        name: "Upper",
        exercises: [
          ["Bench Press", 4, 6],
          ["Barbell Row", 4, 6],
          ["Overhead Press", 3, 8],
          ["Lat Pulldown", 3, 10],
          ["Dumbbell Curl", 3, 12],
          ["Skullcrusher", 3, 12],
        ],
      },
      {
        name: "Lower",
        exercises: [
          ["Squat", 4, 6],
          ["Deadlift", 3, 5],
          ["Lunge", 3, 10],
          ["Leg Extension", 3, 12],
          ["Hip Thrust", 3, 10],
          ["Calf Raise", 4, 15],
        ],
      },
    ],
  },
  {
    id: "gzclp",
    name: "GZCLP",
    level: "Beginner",
    daysPerWeek: "3–4",
    since: 2,
    blurb:
      "Four short days you cycle through: one heavy lift, one medium, one light. Three exercises per session.",
    plans: [
      {
        name: "GZCLP Day 1",
        exercises: [
          ["Squat", 5, 3],
          ["Bench Press", 3, 10],
          ["Lat Pulldown", 3, 15],
        ],
      },
      {
        name: "GZCLP Day 2",
        exercises: [
          ["Overhead Press", 5, 3],
          ["Deadlift", 3, 10],
          ["Barbell Row", 3, 15],
        ],
      },
      {
        name: "GZCLP Day 3",
        exercises: [
          ["Bench Press", 5, 3],
          ["Squat", 3, 10],
          ["Lat Pulldown", 3, 15],
        ],
      },
      {
        name: "GZCLP Day 4",
        exercises: [
          ["Deadlift", 5, 3],
          ["Overhead Press", 3, 10],
          ["Barbell Row", 3, 15],
        ],
      },
    ],
  },
  {
    id: "arnold",
    name: "Arnold Split",
    level: "Advanced",
    daysPerWeek: "6",
    since: 2,
    blurb:
      "Chest & back, shoulders & arms, legs. Each twice a week. Lots of volume, long sessions.",
    plans: [
      {
        name: "Arnold: Chest & Back",
        exercises: [
          ["Bench Press", 4, 10],
          ["Incline Bench Press", 4, 10],
          ["Chest Fly", 3, 12],
          ["Pull-Up", 4, 8],
          ["Barbell Row", 4, 10],
          ["Seated Cable Row", 3, 12],
        ],
      },
      {
        name: "Arnold: Shoulders & Arms",
        exercises: [
          ["Overhead Press", 4, 10],
          ["Lateral Raise", 4, 12],
          ["Face Pull", 3, 15],
          ["Dumbbell Curl", 4, 10],
          ["Hammer Curl", 3, 12],
          ["Skullcrusher", 4, 10],
          ["Tricep Pushdown", 3, 12],
        ],
      },
      {
        name: "Arnold: Legs",
        exercises: [
          ["Squat", 4, 10],
          ["Leg Press", 4, 12],
          ["Romanian Deadlift", 4, 10],
          ["Leg Curl", 3, 12],
          ["Calf Raise", 5, 15],
        ],
      },
    ],
  },
  {
    id: "bodyweight-circuit",
    name: "Bodyweight Circuit",
    level: "Beginner",
    daysPerWeek: "2–4",
    since: 3,
    blurb:
      "No equipment, no excuses. Run through everything once, rest a couple minutes, repeat — sets are your rounds. Log weight as 0.",
    plans: [
      {
        name: "Bodyweight Circuit",
        exercises: [
          ["Air Squat", 3, 15],
          ["Push-Up", 3, 10],
          ["Lunge", 3, 10],
          ["Glute Bridge", 3, 15],
          ["Mountain Climber", 3, 20],
          ["Crunch", 3, 15],
        ],
      },
    ],
  },
  {
    id: "bodyweight-burner",
    name: "Bodyweight Burner",
    level: "Intermediate",
    daysPerWeek: "2–3",
    since: 3,
    blurb:
      "Circuit for when you've got a pull-up bar and something to dip on. Four rounds, minimal rest. Log weight as 0 — or strap some on.",
    plans: [
      {
        name: "Bodyweight Burner",
        exercises: [
          ["Pull-Up", 4, 6],
          ["Push-Up", 4, 15],
          ["Jump Squat", 4, 12],
          ["Dip", 4, 8],
          ["Hanging Knee Raise", 4, 10],
          ["Burpee", 4, 10],
        ],
      },
    ],
  },
];

export function newId(): string {
  return crypto.randomUUID();
}

function materialize(program: Program, seed: SeedPlan): Plan {
  return {
    id: newId(),
    name: seed.name,
    programId: program.id,
    exercises: seed.exercises.map(([name, sets, reps]) => ({
      id: newId(),
      name,
      target: { sets, reps },
    })),
  };
}

/** Fresh copies of every plan in a library program. */
export function programPlans(programId: string): Plan[] {
  const program = PROGRAM_LIBRARY.find((p) => p.id === programId);
  return program ? program.plans.map((seed) => materialize(program, seed)) : [];
}

/** Every library plan, in library order. What a brand-new store starts with. */
export function starterPlans(): Plan[] {
  return PROGRAM_LIBRARY.flatMap((p) => programPlans(p.id));
}

/** A store with no history and the full plan library. */
export function emptyStore(): Store {
  return {
    version: 1,
    workouts: [],
    activeWorkout: null,
    plans: starterPlans(),
    programs: [],
    libraryVersion: LIBRARY_VERSION,
  };
}

/**
 * Add library programs newer than the store's libraryVersion, skipping any
 * plan whose name already exists. Deleting them afterwards sticks because the
 * version is bumped.
 */
export function syncLibrary(store: Store): Store {
  if (store.libraryVersion >= LIBRARY_VERSION) return store;
  const have = new Set(store.plans.map((p) => p.name.toLowerCase()));
  const added: Plan[] = [];
  for (const program of PROGRAM_LIBRARY) {
    if (program.since <= store.libraryVersion) continue;
    for (const seed of program.plans) {
      if (have.has(seed.name.toLowerCase())) continue;
      added.push(materialize(program, seed));
    }
  }
  return { ...store, plans: [...store.plans, ...added], libraryVersion: LIBRARY_VERSION };
}

export function loadStore(): Store {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as Partial<Store>;
    if (parsed?.version !== 1 || !Array.isArray(parsed.workouts)) {
      return emptyStore();
    }
    // Data saved before plans existed gets the whole library. Data from the
    // first plans release (no libraryVersion) is treated as version 1 so
    // syncLibrary adds only what's new.
    if (!Array.isArray(parsed.plans)) {
      return { ...emptyStore(), workouts: parsed.workouts, activeWorkout: parsed.activeWorkout ?? null };
    }
    return syncLibrary({
      version: 1,
      workouts: parsed.workouts,
      activeWorkout: parsed.activeWorkout ?? null,
      plans: parsed.plans,
      programs: Array.isArray(parsed.programs) ? parsed.programs : [],
      libraryVersion: typeof parsed.libraryVersion === "number" ? parsed.libraryVersion : 1,
    });
  } catch {
    return emptyStore();
  }
}

export function saveStore(store: Store): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

/**
 * Start a session. With a plan, its exercises are pre-loaded (with targets)
 * so you just log sets; without one it's a blank freestyle workout.
 */
export function startWorkout(
  store: Store,
  now = new Date().toISOString(),
  plan?: Plan
): Store {
  if (store.activeWorkout) return store;
  const workout: Workout = { id: newId(), startedAt: now, exercises: [] };
  if (plan) {
    workout.planId = plan.id;
    workout.planName = plan.name;
    workout.exercises = plan.exercises.map((e) => ({
      id: newId(),
      name: e.name,
      sets: [],
      target: { ...e.target },
    }));
  }
  return { ...store, activeWorkout: workout };
}

/**
 * Finish the active session. Exercises with zero sets are dropped; if nothing
 * was logged at all, the session is discarded rather than saved as junk.
 */
export function finishWorkout(store: Store, now = new Date().toISOString()): Store {
  const active = store.activeWorkout;
  if (!active) return store;
  const exercises = active.exercises.filter((e) => e.sets.length > 0);
  if (exercises.length === 0) {
    return { ...store, activeWorkout: null };
  }
  const finished: Workout = { ...active, exercises, finishedAt: now };
  return { ...store, workouts: [...store.workouts, finished], activeWorkout: null };
}

export function cancelWorkout(store: Store): Store {
  return { ...store, activeWorkout: null };
}

export function deleteWorkout(store: Store, workoutId: string): Store {
  return { ...store, workouts: store.workouts.filter((w) => w.id !== workoutId) };
}

function updateActive(store: Store, fn: (w: Workout) => Workout): Store {
  if (!store.activeWorkout) return store;
  return { ...store, activeWorkout: fn(store.activeWorkout) };
}

export function addExercise(store: Store, name: string): Store {
  const trimmed = name.trim();
  if (!trimmed) return store;
  return updateActive(store, (w) => ({
    ...w,
    exercises: [...w.exercises, { id: newId(), name: trimmed, sets: [] }],
  }));
}

export function removeExercise(store: Store, exerciseId: string): Store {
  return updateActive(store, (w) => ({
    ...w,
    exercises: w.exercises.filter((e) => e.id !== exerciseId),
  }));
}

export function addSet(
  store: Store,
  exerciseId: string,
  weight: number,
  reps: number
): Store {
  if (!Number.isFinite(weight) || weight < 0 || !Number.isInteger(reps) || reps <= 0) {
    return store;
  }
  return updateActive(store, (w) => ({
    ...w,
    exercises: w.exercises.map((e) =>
      e.id === exerciseId
        ? { ...e, sets: [...e.sets, { id: newId(), weight, reps }] }
        : e
    ),
  }));
}

export function removeSet(store: Store, exerciseId: string, setId: string): Store {
  return updateActive(store, (w) => ({
    ...w,
    exercises: w.exercises.map((e) =>
      e.id === exerciseId
        ? { ...e, sets: e.sets.filter((s) => s.id !== setId) }
        : e
    ),
  }));
}

// ---------------------------------------------------------------------------
// Plans

export function isValidTarget(t: SetTarget): boolean {
  return (
    Number.isInteger(t.sets) && t.sets > 0 && Number.isInteger(t.reps) && t.reps > 0
  );
}

/** Drop blank names and bad targets so a half-filled editor can't save junk. */
function cleanPlanExercises(exercises: PlanExercise[]): PlanExercise[] {
  return exercises
    .map((e) => ({ ...e, name: e.name.trim() }))
    .filter((e) => e.name && isValidTarget(e.target));
}

export function newPlanExercise(name: string, target: SetTarget = { sets: 3, reps: 10 }): PlanExercise {
  return { id: newId(), name: name.trim(), target };
}

/** Drop user programs no plan references anymore. */
function pruneEmptyPrograms(store: Store): Store {
  if (store.programs.length === 0) return store;
  const used = new Set(store.plans.map((p) => p.programId));
  const programs = store.programs.filter((p) => used.has(p.id));
  return programs.length === store.programs.length ? store : { ...store, programs };
}

/** Add a user program. Blank names and duplicates (case-insensitive, library
 *  included) are ignored — tagging a plan with the existing name joins it. */
export function createProgram(store: Store, name: string): Store {
  const trimmed = name.trim();
  if (!trimmed) return store;
  const key = trimmed.toLowerCase();
  const taken =
    store.programs.some((p) => p.name.toLowerCase() === key) ||
    PROGRAM_LIBRARY.some((p) => p.name.toLowerCase() === key);
  if (taken) return store;
  return { ...store, programs: [...store.programs, { id: newId(), name: trimmed }] };
}

/** Id of the program with this name (case-insensitive) — user-created or
 *  built-in, so typing "GZCLP" joins the built-in rotation. */
export function programIdByName(store: Store, name: string): string | undefined {
  const key = name.trim().toLowerCase();
  return (
    store.programs.find((p) => p.name.toLowerCase() === key)?.id ??
    PROGRAM_LIBRARY.find((p) => p.name.toLowerCase() === key)?.id
  );
}

/** Create a plan; returns the store unchanged for a blank name. */
export function createPlan(
  store: Store,
  name: string,
  exercises: PlanExercise[],
  programId?: string
): Store {
  const trimmed = name.trim();
  if (!trimmed) return store;
  const plan: Plan = {
    id: newId(),
    name: trimmed,
    exercises: cleanPlanExercises(exercises),
    ...(programId ? { programId } : {}),
  };
  return { ...store, plans: [...store.plans, plan] };
}

/** Replace a plan by id. Unknown ids and blank names are ignored. */
export function updatePlan(store: Store, plan: Plan): Store {
  const name = plan.name.trim();
  if (!name || !store.plans.some((p) => p.id === plan.id)) return store;
  const next: Plan = { ...plan, name, exercises: cleanPlanExercises(plan.exercises) };
  return pruneEmptyPrograms({
    ...store,
    plans: store.plans.map((p) => (p.id === plan.id ? next : p)),
  });
}

export function deletePlan(store: Store, planId: string): Store {
  return pruneEmptyPrograms({
    ...store,
    plans: store.plans.filter((p) => p.id !== planId),
  });
}

/** Add a library program's plans, skipping names the user already has. */
export function addProgram(store: Store, programId: string): Store {
  const have = new Set(store.plans.map((p) => p.name.toLowerCase()));
  const fresh = programPlans(programId).filter((p) => !have.has(p.name.toLowerCase()));
  if (fresh.length === 0) return store;
  return { ...store, plans: [...store.plans, ...fresh] };
}

const LEVEL_RANK: Record<ProgramLevel, number> = {
  Beginner: 0,
  Intermediate: 1,
  Advanced: 2,
};

/** Library programs easiest-first: Beginner, Intermediate, Advanced. */
export function programsByLevel(): Program[] {
  return [...PROGRAM_LIBRARY].sort((a, b) => LEVEL_RANK[a.level] - LEVEL_RANK[b.level]);
}

export type PlanGroup = {
  /** Program id, or "custom" for user-made plans. */
  key: string;
  label: string;
  level?: ProgramLevel;
  plans: Plan[];
};

/** Group key of the most recent finished workout started from a plan that
 *  still exists. Freestyle workouts are skipped. */
function lastUsedGroupKey(store: Store): string | null {
  for (let i = store.workouts.length - 1; i >= 0; i--) {
    const planId = store.workouts[i].planId;
    if (!planId) continue;
    const plan = store.plans.find((p) => p.id === planId);
    if (!plan) continue;
    const known =
      plan.programId &&
      (PROGRAM_LIBRARY.some((pr) => pr.id === plan.programId) ||
        store.programs.some((pr) => pr.id === plan.programId));
    return known ? plan.programId! : "custom";
  }
  return null;
}

/**
 * Plans grouped by program for picking. User-created groups come first (your
 * programs, then loose "My plans") since they're the likeliest picks, followed
 * by library programs easiest-first. Whatever group was trained from most
 * recently is bumped to the very top.
 */
export function planGroups(store: Store): PlanGroup[] {
  const groups: PlanGroup[] = [];
  for (const program of store.programs) {
    const mine = store.plans.filter((p) => p.programId === program.id);
    if (mine.length) groups.push({ key: program.id, label: program.name, plans: mine });
  }
  const known = new Set([
    ...store.programs.map((p) => p.id),
    ...PROGRAM_LIBRARY.map((p) => p.id),
  ]);
  const loose = store.plans.filter((p) => !p.programId || !known.has(p.programId));
  if (loose.length) groups.push({ key: "custom", label: "My plans", plans: loose });
  for (const program of programsByLevel()) {
    const mine = store.plans.filter((p) => p.programId === program.id);
    if (mine.length) {
      groups.push({ key: program.id, label: program.name, level: program.level, plans: mine });
    }
  }

  const recent = lastUsedGroupKey(store);
  const i = recent ? groups.findIndex((g) => g.key === recent) : -1;
  if (i > 0) {
    const [top] = groups.splice(i, 1);
    groups.unshift(top);
  }
  return groups;
}

/**
 * The plan to do next: the one after the last finished workout's plan within
 * the same program (wrapping), or that same plan if it stands alone. Null
 * when the last workout was freestyle, there's no history, or the plan is gone.
 */
export function nextPlan(store: Store): Plan | null {
  const last = store.workouts[store.workouts.length - 1];
  if (!last?.planId) return null;
  const current = store.plans.find((p) => p.id === last.planId);
  if (!current) return null;
  const cycle = current.programId
    ? store.plans.filter((p) => p.programId === current.programId)
    : [current];
  const i = cycle.findIndex((p) => p.id === current.id);
  return cycle[(i + 1) % cycle.length];
}

/** Sets logged for an exercise in the most recent finished workout that had it. */
export function lastPerformance(
  store: Store,
  exerciseName: string
): { sets: WorkoutSet[]; date: string } | null {
  const key = exerciseName.trim().toLowerCase();
  for (let i = store.workouts.length - 1; i >= 0; i--) {
    const w = store.workouts[i];
    const match = w.exercises.find(
      (e) => e.name.trim().toLowerCase() === key && e.sets.length > 0
    );
    if (match) return { sets: match.sets, date: w.startedAt };
  }
  return null;
}

/** Seed list plus anything the user has ever logged or planned, deduped case-insensitively. */
export function exerciseNameSuggestions(store: Store): string[] {
  const seen = new Map<string, string>();
  for (const name of SEED_EXERCISES) {
    seen.set(name.toLowerCase(), name);
  }
  const all = [...store.workouts, ...(store.activeWorkout ? [store.activeWorkout] : [])];
  for (const workout of all) {
    for (const exercise of workout.exercises) {
      const key = exercise.name.toLowerCase();
      if (!seen.has(key)) seen.set(key, exercise.name);
    }
  }
  for (const plan of store.plans) {
    for (const exercise of plan.exercises) {
      const key = exercise.name.toLowerCase();
      if (!seen.has(key)) seen.set(key, exercise.name);
    }
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b));
}

/**
 * Exercises the user actually did, most recent first (the active session
 * counts as most recent). Deduped case-insensitively, capped at `limit`.
 */
export function recentExerciseNames(store: Store, limit = 8): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const workouts = [
    ...(store.activeWorkout ? [store.activeWorkout] : []),
    ...[...store.workouts].reverse(),
  ];
  for (const workout of workouts) {
    for (const exercise of workout.exercises) {
      const key = exercise.name.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(exercise.name);
      if (out.length >= limit) return out;
    }
  }
  return out;
}

/**
 * Filter exercise names by a search query. Every whitespace-separated token
 * must appear somewhere in the name (case-insensitive), so "inc bench" finds
 * "Incline Bench Press". An empty query matches everything.
 */
export function filterExerciseNames(names: string[], query: string): string[] {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return names;
  return names.filter((name) => {
    const haystack = name.toLowerCase();
    return tokens.every((t) => haystack.includes(t));
  });
}

export function workoutVolume(workout: Workout): number {
  return workout.exercises.reduce(
    (total, e) => total + e.sets.reduce((sum, s) => sum + s.weight * s.reps, 0),
    0
  );
}

export function workoutSetCount(workout: Workout): number {
  return workout.exercises.reduce((n, e) => n + e.sets.length, 0);
}
