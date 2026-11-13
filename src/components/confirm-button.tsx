"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { ComponentProps, ReactNode } from "react";

type ConfirmButtonProps = Omit<ComponentProps<typeof Button>, "onClick"> & {
  onConfirm: () => void;
  confirmLabel?: ReactNode;
};

/**
 * Two-tap destructive action: first tap arms it ("SURE?"), second tap within
 * 3s confirms. No blocking browser dialogs — you're mid-set, not mid-survey.
 */
export function ConfirmButton({
  onConfirm,
  confirmLabel = "SURE?",
  children,
  variant,
  ...props
}: ConfirmButtonProps) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(t);
  }, [armed]);

  return (
    <Button
      {...props}
      variant={armed ? "destructive" : variant}
      onClick={() => {
        if (armed) {
          setArmed(false);
          onConfirm();
        } else {
          setArmed(true);
        }
      }}
    >
      {armed ? confirmLabel : children}
    </Button>
  );
}
