"use client";

import { Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmButton } from "@/components/confirm-button";
import { useWorkoutStore } from "@/hooks/use-workout-store";
import {
  formatDuration,
  formatNumber,
  formatTime,
  formatWorkoutDate,
} from "@/lib/format";
import { deleteWorkout, workoutSetCount, workoutVolume } from "@/lib/storage";

export default function HistoryPage() {
  const { store, update } = useWorkoutStore();

  if (!store) {
    return null;
  }

  const workouts = [...store.workouts].sort((a, b) =>
    b.startedAt.localeCompare(a.startedAt)
  );

  if (workouts.length === 0) {
    return (
      <div className="pt-16 text-center">
        <h1 className="display text-3xl">No history yet</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Go pick something heavy up, then put it back down.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-2">
      <h1 className="display text-2xl">History</h1>
      {workouts.map((workout) => (
        <Card key={workout.id}>
          <CardHeader>
            <div>
              <CardTitle>{formatWorkoutDate(workout.startedAt)}</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatTime(workout.startedAt)}
                {workout.finishedAt &&
                  ` · ${formatDuration(workout.startedAt, workout.finishedAt)}`}
                {` · ${workoutSetCount(workout)} sets · ${formatNumber(
                  workoutVolume(workout)
                )} lb`}
              </p>
            </div>
            <ConfirmButton
              variant="ghost"
              size="icon-sm"
              aria-label="Delete workout"
              confirmLabel={<Trash2 />}
              onConfirm={() => update((s) => deleteWorkout(s, workout.id))}
            >
              <Trash2 className="text-muted-foreground" />
            </ConfirmButton>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {workout.exercises.map((exercise) => (
                <li key={exercise.id} className="text-sm">
                  <span className="font-semibold">{exercise.name}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {" — "}
                    {exercise.sets
                      .map((s) => `${formatNumber(s.weight)}×${s.reps}`)
                      .join(", ")}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
