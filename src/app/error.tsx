"use client";

import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 bg-canvas px-4 py-16 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-[13px] bg-brand shadow-brand">
        <GraduationCap className="h-6 w-6 text-on-brand" strokeWidth={1.8} />
      </div>
      <div>
        <h1 className="font-display text-xl font-semibold">Something went wrong</h1>
        <p className="mt-1 max-w-sm text-[13px] text-ink-soft">
          Nothing was lost — try again. If it keeps happening, note what you were doing and
          contact support.
        </p>
      </div>
      <Button variant="primary" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
