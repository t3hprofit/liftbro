"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ConfirmButton } from "@/components/confirm-button";
import { ExercisePicker } from "@/components/exercise-picker";
import { formatElapsed, formatNumber } from "@/lib/format";
import {
  addExercise,
  addSet,
  cancelWorkout,
  finishWorkout,
  removeExercise,
  removeSet,
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

function SetLogger({
  exercise,
  update,
}: {
  exercise: WorkoutExercise;
  update: UpdateFn;
}) {
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");

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
      {exercise.sets.length > 0 && (
        <ul className="space-y-1.5">
          {exercise.sets.map((set, i) => (
            <li
              key={set.id}
              className="flex items-center gap-3 rounded-lg bg-muted px-3 py-2"
            >
              <span className="w-6 text-xs font-semibold text-muted-foreground">
                {i + 1}
              </span>
              <span className="flex-1 text-sm tabular-nums">
                <span className="font-semibold">{formatNumber(set.weight)}</span>
                <span className="text-muted-foreground"> lb × </span>
                <span className="font-semibold">{set.reps}</span>
              </span>
              <button
                type="button"
                aria-label="Remove set"
                className="text-muted-foreground transition-colors hover:text-destructive"
                onClick={() =>
                  update((s) => removeSet(s, exercise.id, set.id))
                }
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
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
          className="w-24"
        />
        <Button onClick={logSet} disabled={!valid} aria-label="Log set">
          <Plus /> SET
        </Button>
      </div>
    </div>
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

  return (
    <div className="space-y-4">
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
              Volume
            </p>
            <p className="display text-3xl tabular-nums">
              {formatNumber(volume)}
              <span className="ml-1 text-sm text-muted-foreground">lb</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {workout.exercises.map((exercise) => (
        <Card key={exercise.id}>
          <CardHeader>
            <CardTitle>{exercise.name}</CardTitle>
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
            <SetLogger exercise={exercise} update={update} />
          </CardContent>
        </Card>
      ))}

      <ExercisePicker
        store={store}
        exclude={workout.exercises.map((e) => e.name)}
        onPick={(name) => update((s) => addExercise(s, name))}
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
