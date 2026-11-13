"use client";

import { Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkoutLogger } from "@/components/workout-logger";
import { useWorkoutStore } from "@/hooks/use-workout-store";
import { formatNumber, formatWorkoutDate } from "@/lib/format";
import { startWorkout, workoutSetCount, workoutVolume } from "@/lib/storage";

export default function TodayPage() {
  const { store, update } = useWorkoutStore();

  if (!store) {
    return null;
  }

  if (store.activeWorkout) {
    return (
      <WorkoutLogger workout={store.activeWorkout} store={store} update={update} />
    );
  }

  const last = store.workouts[store.workouts.length - 1];

  return (
    <div className="flex flex-col gap-6 pt-8">
      <div className="text-center">
        <h1 className="display text-4xl">Time to lift</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The iron never lies, bro.
        </p>
      </div>

      <Button
        size="lg"
        className="display h-16 text-xl tracking-widest"
        onClick={() => update((s) => startWorkout(s))}
      >
        <Dumbbell className="size-6" /> START WORKOUT
      </Button>

      {last && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Last session
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <p className="display text-xl">{formatWorkoutDate(last.startedAt)}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {last.exercises.map((e) => e.name).join(" · ")}
            </p>
            <p className="mt-2 text-sm tabular-nums">
              <span className="font-semibold">{workoutSetCount(last)}</span>
              <span className="text-muted-foreground"> sets · </span>
              <span className="font-semibold">{formatNumber(workoutVolume(last))}</span>
              <span className="text-muted-foreground"> lb volume</span>
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
