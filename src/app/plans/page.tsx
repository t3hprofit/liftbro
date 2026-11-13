"use client";

import { useState } from "react";
import { ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlanEditor } from "@/components/plan-editor";
import { useWorkoutStore } from "@/hooks/use-workout-store";
import { createPlan, deletePlan, updatePlan, type Plan } from "@/lib/storage";

/** "new" = creating; a plan id = editing; null = list view. */
type Mode = null | "new" | { editId: string };

export default function PlansPage() {
  const { store, update } = useWorkoutStore();
  const [mode, setMode] = useState<Mode>(null);

  if (!store) {
    return null;
  }

  const editing =
    mode && mode !== "new" ? store.plans.find((p) => p.id === mode.editId) : null;

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
      <div className="flex items-center justify-between">
        <h1 className="display text-2xl">Plans</h1>
        <Button variant="secondary" onClick={() => setMode("new")}>
          <Plus /> NEW PLAN
        </Button>
      </div>

      {store.plans.length === 0 ? (
        <div className="pt-12 text-center">
          <p className="display text-xl">No plans</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Build one and your next workout sets itself up.
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
