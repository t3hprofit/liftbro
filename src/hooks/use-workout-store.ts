"use client";

import { useCallback, useSyncExternalStore } from "react";
import { loadStore, saveStore, type Store } from "@/lib/storage";

// Module-level store synced with localStorage. The server/hydration snapshot
// is null so the static HTML and first client render match; real data appears
// right after hydration.
let cache: Store | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): Store | null {
  if (cache === null) cache = loadStore();
  return cache;
}

function getServerSnapshot(): Store | null {
  return null;
}

export function useWorkoutStore() {
  const store = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const update = useCallback((fn: (s: Store) => Store) => {
    const current = getSnapshot();
    if (!current) return;
    cache = fn(current);
    saveStore(cache);
    listeners.forEach((l) => l());
  }, []);

  return { store, update };
}
