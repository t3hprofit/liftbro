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

export type WorkoutExercise = {
  id: string;
  name: string;
  sets: WorkoutSet[];
};

export type Workout = {
  id: string;
  /** ISO timestamps */
  startedAt: string;
  finishedAt?: string;
  exercises: WorkoutExercise[];
};

export type Store = {
  version: 1;
  /** Finished workouts, newest last (sorted on read where it matters). */
  workouts: Workout[];
  /** In-progress session — survives closing the tab mid-workout. */
  activeWorkout: Workout | null;
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

export function newId(): string {
  return crypto.randomUUID();
}

export function emptyStore(): Store {
  return { version: 1, workouts: [], activeWorkout: null };
}

export function loadStore(): Store {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as Store;
    if (parsed?.version !== 1 || !Array.isArray(parsed.workouts)) {
      return emptyStore();
    }
    return parsed;
  } catch {
    return emptyStore();
  }
}

export function saveStore(store: Store): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function startWorkout(store: Store, now = new Date().toISOString()): Store {
  if (store.activeWorkout) return store;
  return {
    ...store,
    activeWorkout: { id: newId(), startedAt: now, exercises: [] },
  };
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

/** Seed list plus anything the user has ever logged, deduped case-insensitively. */
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
