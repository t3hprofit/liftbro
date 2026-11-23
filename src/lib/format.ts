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

/** "45s" / "1:30" / "1:02:05" — timed set durations */
export function formatSeconds(total: number): string {
  const t = Math.max(0, Math.round(total));
  if (t < 60) return `${t}s`;
  const s = t % 60;
  const m = Math.floor(t / 60) % 60;
  const h = Math.floor(t / 3600);
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

/**
 * Parse what someone types into a time field: "45", "90", "1:30", "1:02:05",
 * "2m", "1m30". Returns whole seconds, or null if it doesn't make sense.
 */
export function parseDuration(input: string): number | null {
  const raw = input.trim().toLowerCase();
  if (!raw) return null;
  let m: RegExpMatchArray | null;
  if ((m = raw.match(/^(\d+)$/))) return Number(m[1]);
  if ((m = raw.match(/^(\d+):(\d{1,2})$/))) {
    const sec = Number(m[2]);
    return sec < 60 ? Number(m[1]) * 60 + sec : null;
  }
  if ((m = raw.match(/^(\d+):(\d{1,2}):(\d{1,2})$/))) {
    const min = Number(m[2]);
    const sec = Number(m[3]);
    return min < 60 && sec < 60 ? Number(m[1]) * 3600 + min * 60 + sec : null;
  }
  if ((m = raw.match(/^(\d+)m(?:in)?\s*(\d+)?s?$/))) {
    return Number(m[1]) * 60 + Number(m[2] ?? 0);
  }
  if ((m = raw.match(/^(\d+)s(?:ec)?$/))) return Number(m[1]);
  return null;
}

/** One logged set, however it was logged: "135×8" or "45s". */
export function formatSet(set: { weight: number; reps: number; seconds?: number }): string {
  return set.seconds != null ? formatSeconds(set.seconds) : `${formatNumber(set.weight)}×${set.reps}`;
}
