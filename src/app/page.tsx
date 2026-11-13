"use client";

import { ChevronRight, Dumbbell, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkoutLogger } from "@/components/workout-logger";
import { useWorkoutStore } from "@/hooks/use-workout-store";
import { formatNumber, formatWorkoutDate } from "@/lib/format";
import {
  nextPlan,
  PROGRAM_LIBRARY,
  startWorkout,
  workoutSetCount,
  workoutVolume,
  type Plan,
  type ProgramLevel,
} from "@/lib/storage";
import { LevelBadge } from "@/components/level-badge";

function PlanRow({ plan, onStart }: { plan: Plan; onStart: () => void }) {
  return (
    <button type="button" className="block w-full text-left" onClick={onStart}>
      <Card className="transition-colors hover:bg-muted/60 active:bg-muted">
        <CardContent className="flex items-center gap-3 py-3">
          <Play className="size-4 shrink-0 fill-muted-foreground text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="display text-lg">{plan.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {plan.exercises.map((e) => e.name).join(" · ")}
            </p>
          </div>
        </CardContent>
      </Card>
    </button>
  );
}

/** Plans grouped by library program (in library order), custom plans last. */
function groupPlans(plans: Plan[]) {
  const groups: { label: string; level?: ProgramLevel; plans: Plan[] }[] = [];
  for (const program of PROGRAM_LIBRARY) {
    const mine = plans.filter((p) => p.programId === program.id);
    if (mine.length) groups.push({ label: program.name, level: program.level, plans: mine });
  }
  const custom = plans.filter(
    (p) => !p.programId || !PROGRAM_LIBRARY.some((pr) => pr.id === p.programId)
  );
  if (custom.length) groups.push({ label: "My plans", plans: custom });
  return groups;
}

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
  const suggested = nextPlan(store);
  const groups = groupPlans(store.plans);

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
        <div className="space-y-5">
          {suggested && (
            <div className="space-y-2">
              <p className="text-xs tracking-widest text-muted-foreground uppercase">
                Next up
              </p>
              <button
                type="button"
                className="block w-full text-left"
                onClick={() => update((s) => startWorkout(s, undefined, suggested))}
              >
                <Card className="border-primary bg-primary/10 transition-colors hover:bg-primary/15 active:bg-primary/20">
                  <CardContent className="flex items-center gap-3">
                    <Play className="size-7 shrink-0 fill-primary text-primary" />
                    <div className="min-w-0 flex-1">
                      <p className="display text-2xl">{suggested.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {suggested.exercises.map((e) => e.name).join(" · ")}
                      </p>
                    </div>
                    <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
                  </CardContent>
                </Card>
              </button>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs tracking-widest text-muted-foreground uppercase">
              {suggested ? "Or pick a plan" : "Pick a plan"}
            </p>
            {groups.map(({ label, level, plans }) => (
              <div key={label} className="space-y-1.5 pt-1">
                <div className="flex items-center gap-2 px-1">
                  <p className="display text-sm tracking-wide text-muted-foreground">
                    {label}
                  </p>
                  {level && <LevelBadge level={level} />}
                </div>
                {plans.map((plan) => (
                  <PlanRow
                    key={plan.id}
                    plan={plan}
                    onStart={() => update((s) => startWorkout(s, undefined, plan))}
                  />
                ))}
              </div>
            ))}
          </div>

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
