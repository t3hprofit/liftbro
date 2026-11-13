"use client";

import { Dumbbell, Play } from "lucide-react";
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

      {store.plans.length === 0 ? (
        <Button
          size="lg"
          className="display h-16 text-xl tracking-widest"
          onClick={() => update((s) => startWorkout(s))}
        >
          <Dumbbell className="size-6" /> START WORKOUT
        </Button>
      ) : (
        <div className="space-y-2">
          <p className="text-xs tracking-widest text-muted-foreground uppercase">
            Pick a plan
          </p>
          {store.plans.map((plan) => (
            <button
              key={plan.id}
              type="button"
              className="block w-full text-left"
              onClick={() => update((s) => startWorkout(s, undefined, plan))}
            >
              <Card className="border-primary/40 transition-colors hover:bg-muted/60 active:bg-muted">
                <CardContent className="flex items-center gap-3 py-3">
                  <Play className="size-5 shrink-0 fill-primary text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="display text-lg">{plan.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {plan.exercises.map((e) => e.name).join(" · ")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </button>
          ))}
          <Button
            variant="outline"
            size="lg"
            className="display w-full tracking-widest"
            onClick={() => update((s) => startWorkout(s))}
          >
            <Dumbbell /> FREESTYLE WORKOUT
          </Button>
        </div>
      )}

      {last && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Last session
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <p className="display text-xl">
              {formatWorkoutDate(last.startedAt)}
              {last.planName && (
                <span className="text-muted-foreground"> · {last.planName}</span>
              )}
            </p>
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
