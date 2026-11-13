export function formatNumber(n: number): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: 1 });
}

/** "Wed, Nov 12" */
export function formatWorkoutDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/** "6:42 PM" */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

/** "47 min" / "1 h 12 min" */
export function formatDuration(startIso: string, endIso: string): string {
  const mins = Math.max(
    1,
    Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000)
  );
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

/** "12:34" / "1:02:34" — live session clock */
export function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const s = total % 60;
  const m = Math.floor(total / 60) % 60;
  const h = Math.floor(total / 3600);
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}
