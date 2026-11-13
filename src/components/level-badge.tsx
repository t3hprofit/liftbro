import type { ProgramLevel } from "@/lib/storage";
import { cn } from "@/lib/utils";

const LEVEL_STYLE: Record<ProgramLevel, string> = {
  Beginner: "bg-emerald-500/15 text-emerald-400",
  Intermediate: "bg-amber-500/15 text-amber-400",
  Advanced: "bg-primary/15 text-primary",
};

export function LevelBadge({ level }: { level: ProgramLevel }) {
  return (
    <span
      className={cn(
        "rounded px-1.5 py-0.5 text-[0.65rem] font-semibold tracking-widest uppercase",
        LEVEL_STYLE[level]
      )}
    >
      {level}
    </span>
  );
}
