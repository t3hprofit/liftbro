"use client";

import { useState } from "react";
import { Search, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatSet } from "@/lib/format";
import {
  convertSetsToTime,
  exerciseNameSuggestions,
  filterExerciseNames,
  isTimed,
  setExerciseTimed,
  unconvertedSets,
  type Store,
} from "@/lib/storage";
import { cn } from "@/lib/utils";

type UpdateFn = (fn: (s: Store) => Store) => void;

/**
 * Per-exercise settings. Today that's one thing: whether it's logged by time
 * (plank, battle ropes) or by weight × reps. Flipping an exercise to timed
 * when it has history offers to convert those sets, since before timed sets
 * existed people stuffed seconds into the reps or weight field.
 */
export function ExerciseSettings({ store, update }: { store: Store; update: UpdateFn }) {
  const [query, setQuery] = useState("");
  // Exercises whose "convert past sets?" prompt was waved away this visit.
  const [dismissed, setDismissed] = useState<string[]>([]);
  const names = filterExerciseNames(exerciseNameSuggestions(store), query);

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Timed exercises get a seconds field instead of weight and reps.
      </p>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Find an exercise…"
          aria-label="Find an exercise"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>
      <Card>
        <CardContent className="p-2">
          <ul className="divide-y divide-border">
            {names.length === 0 && (
              <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                No exercise matches.
              </li>
            )}
            {names.map((name) => {
              const timed = isTimed(store, name);
              const pending = unconvertedSets(store, name);
              const askConvert = timed && pending.length > 0 && !dismissed.includes(name);
              return (
                <li key={name} className="px-2 py-1.5">
                  <div className="flex items-center gap-2">
                    <span className="flex-1 truncate text-sm font-semibold">{name}</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={timed}
                      aria-label={`${name} timed`}
                      onClick={() => {
                        update((s) => setExerciseTimed(s, name, !timed));
                        setDismissed((d) => d.filter((n) => n !== name));
                      }}
                      className={cn(
                        "flex items-center gap-1 rounded-md px-2 py-1 text-[0.7rem] font-semibold tracking-widest uppercase transition-colors",
                        timed
                          ? "bg-primary/15 text-primary"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Timer className="size-3.5" /> {timed ? "Timed" : "Reps"}
                    </button>
                  </div>
                  {askConvert && (
                    <div className="mt-1.5 rounded-lg bg-muted px-3 py-2 text-xs">
                      <p className="text-muted-foreground">
                        {pending.length} past {pending.length === 1 ? "set" : "sets"} logged as
                        weight × reps, e.g.{" "}
                        <span className="text-foreground tabular-nums">
                          {pending.slice(0, 3).map(formatSet).join(", ")}
                        </span>
                        . Which number was the seconds?
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => update((s) => convertSetsToTime(s, name, "reps"))}
                        >
                          REPS
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => update((s) => convertSetsToTime(s, name, "weight"))}
                        >
                          WEIGHT
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDismissed((d) => [...d, name])}
                        >
                          LEAVE AS IS
                        </Button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
