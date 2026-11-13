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
};

export type Store = {
  version: 1;
  /** Finished workouts, newest last (sorted on read where it matters). */
  workouts: Workout[];
  /** In-progress session — survives closing the tab mid-workout. */
  activeWorkout: Workout | null;
  /** Workout templates. Seeded with starters on first load. */
  plans: Plan[];
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
];

type SeedPlan = { name: string; exercises: [string, number, number][] };

/** Starter templates. Editable and deletable like anything else. */
const SEED_PLANS: SeedPlan[] = [
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
      ["Pull-Up", 3, 8],
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
];

export function newId(): string {
  return crypto.randomUUID();
}

export function starterPlans(): Plan[] {
  return SEED_PLANS.map((p) => ({
    id: newId(),
    name: p.name,
    exercises: p.exercises.map(([name, sets, reps]) => ({
      id: newId(),
      name,
      target: { sets, reps },
    })),
  }));
}

/** A store with no history and the starter plans. */
export function emptyStore(): Store {
  return { version: 1, workouts: [], activeWorkout: null, plans: starterPlans() };
}

export function loadStore(): Store {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as Partial<Store>;
    if (parsed?.version !== 1 || !Array.isArray(parsed.workouts)) {
      return emptyStore();
    }
    // Data saved before plans existed: seed the starters once. An explicit
    // empty array means the user deleted them all, so leave it alone.
    const plans = Array.isArray(parsed.plans) ? parsed.plans : starterPlans();
    return {
      version: 1,
      workouts: parsed.workouts,
      activeWorkout: parsed.activeWorkout ?? null,
      plans,
    };
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

/** Create a plan; returns the store unchanged for a blank name. */
export function createPlan(store: Store, name: string, exercises: PlanExercise[]): Store {
  const trimmed = name.trim();
  if (!trimmed) return store;
  const plan: Plan = { id: newId(), name: trimmed, exercises: cleanPlanExercises(exercises) };
  return { ...store, plans: [...store.plans, plan] };
}

/** Replace a plan by id. Unknown ids and blank names are ignored. */
export function updatePlan(store: Store, plan: Plan): Store {
  const name = plan.name.trim();
  if (!name || !store.plans.some((p) => p.id === plan.id)) return store;
  const next: Plan = { ...plan, name, exercises: cleanPlanExercises(plan.exercises) };
  return { ...store, plans: store.plans.map((p) => (p.id === plan.id ? next : p)) };
}

export function deletePlan(store: Store, planId: string): Store {
  return { ...store, plans: store.plans.filter((p) => p.id !== planId) };
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
