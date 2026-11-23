import { Trophy } from "lucide-react";

/** Small red "PR" pill shown beside a set that was a personal record. */
export function PrBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded bg-primary/15 px-1 py-px text-[0.6rem] font-bold tracking-widest text-primary uppercase ${className}`}
      aria-label="Personal record"
    >
      <Trophy className="size-2.5" /> PR
    </span>
  );
}
