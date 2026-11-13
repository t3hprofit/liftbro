"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ConfirmButton } from "@/components/confirm-button";
import { ExercisePicker } from "@/components/exercise-picker";
import { newId, type Plan, type PlanExercise, type Store } from "@/lib/storage";

/** Editor-local row: targets stay strings while typing so "" is allowed. */
type Row = { id: string; name: string; sets: string; reps: string };

function toRows(plan: Plan | null): Row[] {
  if (!plan) return [];
  return plan.exercises.map((e) => ({
    id: e.id,
    name: e.name,
    sets: String(e.target.sets),
    reps: String(e.target.reps),
  }));
}

function rowValid(r: Row): boolean {
  const sets = Number.parseInt(r.sets, 10);
  const reps = Number.parseInt(r.reps, 10);
  return Number.isInteger(sets) && sets > 0 && Number.isInteger(reps) && reps > 0;
}

function toExercises(rows: Row[]): PlanExercise[] {
  return rows.filter(rowValid).map((r) => ({
    id: r.id,
    name: r.name,
    target: { sets: Number.parseInt(r.sets, 10), reps: Number.parseInt(r.reps, 10) },
  }));
}

/**
 * Create or edit a plan. Rows are an ordered list of exercises with
 * sets × reps targets; exercises are added via the same picker used mid-workout.
 */
export function PlanEditor({
  plan,
  store,
  onSave,
  onCancel,
  onDelete,
}: {
  /** null = creating a new plan */
  plan: Plan | null;
  store: Store;
  onSave: (plan: Plan) => void;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  const [name, setName] = useState(plan?.name ?? "");
  const [rows, setRows] = useState<Row[]>(() => toRows(plan));

  const exercises = toExercises(rows);
  const canSave = name.trim().length > 0 && exercises.length > 0;

  const patch = (id: string, changes: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...changes } : r)));

  const move = (index: number, dir: -1 | 1) =>
    setRows((rs) => {
      const j = index + dir;
      if (j < 0 || j >= rs.length) return rs;
      const next = [...rs];
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="display text-2xl">{plan ? "Edit plan" : "New plan"}</h1>
        <Button variant="ghost" size="icon" aria-label="Cancel" onClick={onCancel}>
          <X />
        </Button>
      </div>

      <Input
        placeholder="Plan name (e.g. Push Day)"
        aria-label="Plan name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="display h-12 text-lg tracking-wide"
      />

      {rows.length > 0 && (
        <Card>
          <CardContent className="p-2">
            <div className="grid grid-cols-[1fr_3.5rem_3.5rem_auto] items-center gap-2 px-2 pb-1 text-[0.65rem] font-semibold tracking-widest text-muted-foreground uppercase">
              <span>Exercise</span>
              <span className="text-center">Sets</span>
              <span className="text-center">Reps</span>
              <span className="w-[4.5rem]" />
            </div>
            <ul className="space-y-1">
              {rows.map((row, i) => (
                <li
                  key={row.id}
                  className="grid grid-cols-[1fr_3.5rem_3.5rem_auto] items-center gap-2 rounded-lg bg-muted px-2 py-1.5"
                >
                  <span className="truncate text-sm font-semibold">{row.name}</span>
                  <Input
                    inputMode="numeric"
                    aria-label={`${row.name} sets`}
                    value={row.sets}
                    onChange={(e) => patch(row.id, { sets: e.target.value })}
                    className="h-9 px-2 text-center tabular-nums"
                  />
                  <Input
                    inputMode="numeric"
                    aria-label={`${row.name} reps`}
                    value={row.reps}
                    onChange={(e) => patch(row.id, { reps: e.target.value })}
                    className="h-9 px-2 text-center tabular-nums"
                  />
                  <div className="flex w-[4.5rem] justify-end">
                    <button
                      type="button"
                      aria-label={`Move ${row.name} up`}
                      disabled={i === 0}
                      className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                      onClick={() => move(i, -1)}
                    >
                      <ArrowUp className="size-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Move ${row.name} down`}
                      disabled={i === rows.length - 1}
                      className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                      onClick={() => move(i, 1)}
                    >
                      <ArrowDown className="size-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Remove ${row.name}`}
                      className="p-1 text-muted-foreground hover:text-destructive"
                      onClick={() => setRows((rs) => rs.filter((r) => r.id !== row.id))}
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <ExercisePicker
        store={store}
        exclude={rows.map((r) => r.name)}
        onPick={(picked) =>
          setRows((rs) => [...rs, { id: newId(), name: picked, sets: "3", reps: "10" }])
        }
      />

      <div className="flex gap-2 pt-2">
        {plan && onDelete && (
          <ConfirmButton
            variant="outline"
            className="text-muted-foreground"
            aria-label="Delete plan"
            confirmLabel="DELETE?"
            onConfirm={onDelete}
          >
            <Trash2 />
          </ConfirmButton>
        )}
        <Button
          size="lg"
          className="display flex-1 tracking-widest"
          disabled={!canSave}
          onClick={() =>
            onSave({ id: plan?.id ?? newId(), name: name.trim(), exercises })
          }
        >
          SAVE PLAN
        </Button>
      </div>
      {!canSave && (
        <p className="text-center text-xs text-muted-foreground">
          Name it and add at least one exercise with sets and reps.
        </p>
      )}
    </div>
  );
}
