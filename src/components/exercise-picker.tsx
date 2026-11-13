"use client";

import { useMemo, useState } from "react";
import { History, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  exerciseNameSuggestions,
  filterExerciseNames,
  recentExerciseNames,
  type Store,
} from "@/lib/storage";

type Row = { kind: "create" | "recent" | "all"; name: string };

function buildRows(store: Store, query: string, exclude: string[]): Row[] {
  const taken = new Set(exclude.map((n) => n.trim().toLowerCase()));
  const notTaken = (n: string) => !taken.has(n.trim().toLowerCase());
  const q = query.trim();

  const recent = recentExerciseNames(store).filter(notTaken);
  const recentKeys = new Set(recent.map((n) => n.toLowerCase()));
  const all = filterExerciseNames(exerciseNameSuggestions(store), q).filter(
    (n) => notTaken(n) && (q ? true : !recentKeys.has(n.toLowerCase()))
  );

  const rows: Row[] = [];
  const exactExists =
    q.length > 0 &&
    exerciseNameSuggestions(store).some(
      (n) => n.toLowerCase() === q.toLowerCase()
    );
  if (!q) rows.push(...recent.map((name) => ({ kind: "recent" as const, name })));
  rows.push(...all.map((name) => ({ kind: "all" as const, name })));
  // Create goes last so Enter picks the best real match when one exists.
  if (q && !exactExists) rows.push({ kind: "create", name: q });
  return rows;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 pt-3 pb-1 text-[0.65rem] font-semibold tracking-widest text-muted-foreground uppercase">
      {children}
    </p>
  );
}

/**
 * Inline exercise picker. Collapsed it's a single "ADD EXERCISE" button;
 * expanded it's a search box over a tappable list: recently used exercises
 * first, then the full catalogue, plus a "Create" row for anything new.
 * Enter picks the top row. Exercises already in the current workout are hidden.
 */
export function ExercisePicker({
  store,
  exclude,
  onPick,
}: {
  store: Store;
  /** Exercise names already in the active workout. */
  exclude: string[];
  onPick: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const rows = useMemo(
    () => (open ? buildRows(store, query, exclude) : []),
    [open, store, query, exclude]
  );

  const pick = (name: string) => {
    onPick(name);
    setQuery("");
    setOpen(false);
  };

  const close = () => {
    setQuery("");
    setOpen(false);
  };

  if (!open) {
    return (
      <Button
        variant="outline"
        size="lg"
        className="display w-full border-dashed tracking-widest"
        onClick={() => setOpen(true)}
      >
        <Plus /> ADD EXERCISE
      </Button>
    );
  }

  return (
    <Card>
      <CardContent className="p-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Search or type a new exercise…"
              aria-label="Search exercises"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && rows[0]) pick(rows[0].name);
                if (e.key === "Escape") close();
              }}
              className="pl-9"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Close exercise picker"
            onClick={close}
          >
            <X />
          </Button>
        </div>

        <ul className="mt-1 max-h-72 overflow-y-auto">
          {rows.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">
              Nothing here yet. Type a name to add it.
            </li>
          )}
          {rows.map((row, i) => {
            const showLabel = i === 0 || rows[i - 1].kind !== row.kind;
            return (
              <li key={`${row.kind}:${row.name}`}>
                {showLabel && row.kind === "recent" && (
                  <SectionLabel>Recent</SectionLabel>
                )}
                {showLabel && row.kind === "all" && (
                  <SectionLabel>{query.trim() ? "Matches" : "All exercises"}</SectionLabel>
                )}
                <button
                  type="button"
                  onClick={() => pick(row.name)}
                  className={
                    row.kind === "create"
                      ? "flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-primary transition-colors hover:bg-muted active:bg-muted"
                      : "flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted active:bg-muted"
                  }
                >
                  {row.kind === "create" && <Plus className="size-4" />}
                  {row.kind === "recent" && (
                    <History className="size-4 text-muted-foreground" />
                  )}
                  <span className="flex-1 truncate">
                    {row.kind === "create" ? (
                      <>
                        Create <span className="text-foreground">“{row.name}”</span>
                      </>
                    ) : (
                      row.name
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
