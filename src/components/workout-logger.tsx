"use client";

import { useEffect, useState } from "react";
import { Check, Plus, Timer, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ConfirmButton } from "@/components/confirm-button";
import { ExercisePicker } from "@/components/exercise-picker";
import { PrBadge } from "@/components/pr-badge";
import { formatElapsed, formatNumber, formatSeconds, formatSet, parseDuration } from "@/lib/format";
import { prSetIds } from "@/lib/stats";
import {
  addExercise,
  addSet,
  addTimedSet,
  cancelWorkout,
  finishWorkout,
  isTimed,
  lastPerformance,
  removeExercise,
  removeSet,
  setExerciseTimed,
  workoutVolume,
  type Store,
  type Workout,
  type WorkoutExercise,
} from "@/lib/storage";

type UpdateFn = (fn: (s: Store) => Store) => void;

function SessionClock({ startedAt }: { startedAt: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <span className="display text-3xl tabular-nums">
      {formatElapsed(now - new Date(startedAt).getTime())}
    </span>
  );
}

/** The logged sets of one exercise, each with a remove × and a PR tag when earned. */
function SetList({
  exercise,
  prs,
  update,
}: {
  exercise: WorkoutExercise;
  prs: Set<string>;
  update: UpdateFn;
}) {
  if (exercise.sets.length === 0) return null;
  return (
    <ul className="space-y-1.5">
      {exercise.sets.map((set, i) => (
        <li
          key={set.id}
          className="flex items-center gap-3 rounded-lg bg-muted px-3 py-2"
        >
          <span className="w-6 text-xs font-semibold text-muted-foreground">
            {i + 1}
          </span>
          <span className="flex flex-1 items-center gap-2 text-sm tabular-nums">
            {set.seconds != null ? (
              <span className="font-semibold">{formatSeconds(set.seconds)}</span>
            ) : (
              <span>
                <span className="font-semibold">{formatNumber(set.weight)}</span>
                <span className="text-muted-foreground"> lb × </span>
                <span className="font-semibold">{set.reps}</span>
              </span>
            )}
            {prs.has(set.id) && <PrBadge />}
          </span>
          <button
            type="button"
            aria-label="Remove set"
            className="text-muted-foreground transition-colors hover:text-destructive"
            onClick={() => update((s) => removeSet(s, exercise.id, set.id))}
          >
            <X className="size-4" />
          </button>
        </li>
      ))}
    </ul>
  );
}

function LastTime({ sets }: { sets: WorkoutExercise["sets"] }) {
  return (
    <p className="text-xs text-muted-foreground tabular-nums">
      Last time: {sets.map(formatSet).join(", ")}
    </p>
  );
}

/** Timed exercises: one field that takes "45", "1:30" or "2m". */
function TimedSetLogger({
  exercise,
  store,
  prs,
  update,
}: {
  exercise: WorkoutExercise;
  store: Store;
  prs: Set<string>;
  update: UpdateFn;
}) {
  const last = lastPerformance(store, exercise.name);
  const [time, setTime] = useState(() => {
    if (exercise.target?.seconds) return String(exercise.target.seconds);
    const prev = last?.sets[last.sets.length - 1].seconds;
    return prev ? String(prev) : "";
  });
  const seconds = parseDuration(time);
  const valid = seconds != null && seconds > 0;

  return (
    <div className="space-y-2">
      {last && <LastTime sets={last.sets} />}
      <SetList exercise={exercise} prs={prs} update={update} />
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Timer className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            inputMode="numeric"
            placeholder="Seconds (or 1:30)"
            aria-label="Time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="pl-9"
          />
          {valid && (
            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground tabular-nums">
              {formatSeconds(seconds)}
            </span>
          )}
        </div>
        <Button
          onClick={() => valid && update((s) => addTimedSet(s, exercise.id, seconds))}
          disabled={!valid}
          aria-label="Log set"
        >
          <Plus /> LOG SET
        </Button>
      </div>
    </div>
  );
}

function SetLogger({
  exercise,
  store,
  prs,
  update,
}: {
  exercise: WorkoutExercise;
  store: Store;
  prs: Set<string>;
  update: UpdateFn;
}) {
  const last = lastPerformance(store, exercise.name);
  // Pre-fill what you did last time and what the plan asks for, so a set is
  // usually just one tap on LOG SET.
  const prev = last?.sets[last.sets.length - 1];
  const [weight, setWeight] = useState(() =>
    prev && prev.seconds == null ? formatNumber(prev.weight) : ""
  );
  const [reps, setReps] = useState(() => {
    if (exercise.target?.reps) return String(exercise.target.reps);
    return prev && prev.seconds == null ? String(prev.reps) : "";
  });

  const parsedWeight = Number.parseFloat(weight);
  const parsedReps = Number.parseInt(reps, 10);
  const valid =
    Number.isFinite(parsedWeight) &&
    parsedWeight >= 0 &&
    Number.isInteger(parsedReps) &&
    parsedReps > 0;

  const logSet = () => {
    if (!valid) return;
    update((s) => addSet(s, exercise.id, parsedWeight, parsedReps));
    // Keep values — repeating a set is one tap on ADD.
  };

  return (
    <div className="space-y-2">
      {last && <LastTime sets={last.sets} />}
      <SetList exercise={exercise} prs={prs} update={update} />
      <div className="flex gap-2">
        <Input
          inputMode="decimal"
          placeholder="Weight (lb)"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          className="flex-1"
        />
        <Input
          inputMode="numeric"
          placeholder="Reps"
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          className="w-20"
        />
        <Button onClick={logSet} disabled={!valid} aria-label="Log set">
          <Plus /> LOG SET
        </Button>
      </div>
    </div>
  );
}

/** "2/4 sets · 6 reps" under a planned exercise; flips to a check when done. */
function TargetProgress({ exercise }: { exercise: WorkoutExercise }) {
  const target = exercise.target!;
  const done = exercise.sets.length;
  const complete = done >= target.sets;
  return (
    <p
      className={`mt-1 flex items-center gap-1 text-xs tabular-nums ${
        complete ? "text-primary" : "text-muted-foreground"
      }`}
    >
      {complete && <Check className="size-3.5" />}
      <span className="font-semibold">
        {done}/{target.sets}
      </span>
      <span>
        {" "}
        sets · target {target.sets} ×{" "}
        {target.seconds != null ? formatSeconds(target.seconds) : target.reps}
      </span>
    </p>
  );
}

export function WorkoutLogger({
  workout,
  store,
  update,
}: {
  workout: Workout;
  store: Store;
  update: UpdateFn;
}) {
  const volume = workoutVolume(workout);
  const hasSets = workout.exercises.some((e) => e.sets.length > 0);
  const prs = prSetIds(store);
  const prCount = workout.exercises.reduce(
    (n, e) => n + e.sets.filter((s) => prs.has(s.id)).length,
    0
  );

  return (
    <div className="space-y-4">
      {workout.planName && (
        <h1 className="display pt-1 text-2xl">{workout.planName}</h1>
      )}
      <Card>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="text-xs tracking-widest text-muted-foreground uppercase">
              Session time
            </p>
            <SessionClock startedAt={workout.startedAt} />
          </div>
          <div className="text-right">
            <p className="text-xs tracking-widest text-muted-foreground uppercase">
              {prCount > 0 ? "Volume · PRs" : "Volume"}
            </p>
            <p className="display text-3xl tabular-nums">
              {formatNumber(volume)}
              <span className="ml-1 text-sm text-muted-foreground">lb</span>
              {prCount > 0 && (
                <span className="ml-2 text-primary">
                  {prCount}
                  <span className="ml-0.5 text-sm">PR{prCount === 1 ? "" : "s"}</span>
                </span>
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      {workout.exercises.map((exercise) => (
        <Card key={exercise.id}>
          <CardHeader>
            <div className="min-w-0 flex-1">
              <CardTitle className="truncate">{exercise.name}</CardTitle>
              {exercise.target && <TargetProgress exercise={exercise} />}
            </div>
            <ConfirmButton
              variant="ghost"
              size="icon-sm"
              aria-label={`Remove ${exercise.name}`}
              confirmLabel={<Trash2 />}
              onConfirm={() => update((s) => removeExercise(s, exercise.id))}
            >
              <Trash2 className="text-muted-foreground" />
            </ConfirmButton>
          </CardHeader>
          <CardContent>
            {isTimed(store, exercise.name) ? (
              <TimedSetLogger exercise={exercise} store={store} prs={prs} update={update} />
            ) : (
              <SetLogger exercise={exercise} store={store} prs={prs} update={update} />
            )}
          </CardContent>
        </Card>
      ))}

      <ExercisePicker
        store={store}
        exclude={workout.exercises.map((e) => e.name)}
        onPick={(name, { timed }) =>
          update((s) => addExercise(timed ? setExerciseTimed(s, name, true) : s, name))
        }
      />

      <div className="flex gap-2 pt-2">
        <ConfirmButton
          variant="outline"
          className="text-muted-foreground"
          confirmLabel="DISCARD IT?"
          onConfirm={() => update(cancelWorkout)}
        >
          DISCARD
        </ConfirmButton>
        <Button
          size="lg"
          className="display flex-1 tracking-widest"
          disabled={!hasSets}
          onClick={() => update((s) => finishWorkout(s))}
        >
          FINISH WORKOUT
        </Button>
      </div>
      {!hasSets && (
        <p className="text-center text-xs text-muted-foreground">
          Log at least one set to finish. No participation trophies.
        </p>
      )}
    </div>
  );
}
