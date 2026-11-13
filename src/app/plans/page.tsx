"use client";

import { useState } from "react";
import { BookOpen, Check, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlanEditor } from "@/components/plan-editor";
import { useWorkoutStore } from "@/hooks/use-workout-store";
import {
  addProgram,
  createPlan,
  deletePlan,
  PROGRAM_LIBRARY,
  updatePlan,
  type Plan,
} from "@/lib/storage";
import { LevelBadge } from "@/components/level-badge";

/** "new" = creating; "library" = browsing programs; a plan id = editing; null = list. */
type Mode = null | "new" | "library" | { editId: string };

function programName(programId?: string): string | undefined {
  return PROGRAM_LIBRARY.find((p) => p.id === programId)?.name;
}

export default function PlansPage() {
  const { store, update } = useWorkoutStore();
  const [mode, setMode] = useState<Mode>(null);

  if (!store) {
    return null;
  }

  const editing =
    mode && typeof mode === "object" ? store.plans.find((p) => p.id === mode.editId) : null;

  if (mode === "library") {
    const have = new Set(store.plans.map((p) => p.name.toLowerCase()));
    return (
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h1 className="display text-2xl">Library</h1>
          <Button variant="ghost" onClick={() => setMode(null)}>
            DONE
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Proven programs, ready to go. Add one and its days show up on Today.
        </p>
        {PROGRAM_LIBRARY.map((program) => {
          const missing = program.plans.filter((d) => !have.has(d.name.toLowerCase()));
          return (
            <Card key={program.id}>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <p className="display flex-1 text-lg">{program.name}</p>
                  <LevelBadge level={program.level} />
                </div>
                <p className="text-sm text-muted-foreground">{program.blurb}</p>
                <p className="text-xs text-muted-foreground">
                  {program.daysPerWeek} days a week ·{" "}
                  {program.plans.map((d) => d.name).join(", ")}
                </p>
                {missing.length === 0 ? (
                  <p className="flex items-center gap-1 pt-1 text-xs font-semibold text-emerald-400">
                    <Check className="size-3.5" /> ADDED
                  </p>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-1"
                    onClick={() => update((s) => addProgram(s, program.id))}
                  >
                    <Plus />
                    {missing.length === program.plans.length
                      ? "ADD"
                      : `ADD MISSING (${missing.length})`}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  if (mode === "new" || editing) {
    return (
      <div className="pt-2">
        <PlanEditor
          plan={editing ?? null}
          store={store}
          onCancel={() => setMode(null)}
          onSave={(plan: Plan) => {
            update((s) =>
              editing ? updatePlan(s, plan) : createPlan(s, plan.name, plan.exercises)
            );
            setMode(null);
          }}
          onDelete={
            editing
              ? () => {
                  update((s) => deletePlan(s, editing.id));
                  setMode(null);
                }
              : undefined
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between gap-2">
        <h1 className="display flex-1 text-2xl">Plans</h1>
        <Button variant="outline" onClick={() => setMode("library")}>
          <BookOpen /> LIBRARY
        </Button>
        <Button variant="secondary" onClick={() => setMode("new")}>
          <Plus /> NEW
        </Button>
      </div>

      {store.plans.length === 0 ? (
        <div className="pt-12 text-center">
          <p className="display text-xl">No plans</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Grab one from the library or build your own.
          </p>
        </div>
      ) : (
        store.plans.map((plan) => (
          <button
            key={plan.id}
            type="button"
            className="block w-full text-left"
            onClick={() => setMode({ editId: plan.id })}
          >
            <Card className="transition-colors hover:bg-muted/60 active:bg-muted">
              <CardContent className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="display text-lg">{plan.name}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {programName(plan.programId) && `${programName(plan.programId)} · `}
                    {plan.exercises.length}{" "}
                    {plan.exercises.length === 1 ? "exercise" : "exercises"}
                    {plan.exercises.length > 0 &&
                      ` · ${plan.exercises.map((e) => e.name).join(" · ")}`}
                  </p>
                </div>
                <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
              </CardContent>
            </Card>
          </button>
        ))
      )}
    </div>
  );
}
