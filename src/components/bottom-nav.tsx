"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dumbbell, History } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Today", icon: Dumbbell },
  { href: "/history", label: "History", icon: History },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="mx-auto flex max-w-lg">
        {links.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="size-5" />
              <span className="display tracking-widest">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
