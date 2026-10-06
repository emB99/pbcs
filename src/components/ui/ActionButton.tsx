"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { cn } from "@/lib/cn";
import type { DialogResult } from "@/lib/types";

/**
 * A button that runs a server action and says how it went in a line beside it.
 * Give `confirm` to ask first (for anything that emails many people).
 * `compact` renders a text link instead of a bordered button, for table rows.
 */
export function ActionButton({
  label,
  icon,
  action,
  confirm,
  compact,
  variant,
}: {
  label: string;
  icon?: ReactNode;
  action: () => Promise<DialogResult>;
  confirm?: { title: string; description: string; confirmLabel: string };
  compact?: boolean;
  variant?: "default" | "primary";
}) {
  const [result, setResult] = useState<DialogResult | null>(null);
  const [asking, setAsking] = useState(false);
  const [pending, startTransition] = useTransition();

  function run() {
    startTransition(async () => {
      try {
        setResult(await action());
      } catch {
        setResult({ ok: false, message: "Something went wrong. Try again." });
      }
    });
  }

  const message = result?.message && (
    <span role="status" className={cn("text-[11.5px]", result.ok ? "text-success-ink" : "text-danger")}>
      {result.message}
    </span>
  );

  return (
    <>
      {compact ? (
        <span className="flex flex-col items-end gap-0.5">
          <button
            type="button"
            disabled={pending}
            onClick={() => (confirm ? setAsking(true) : run())}
            className="text-[11.5px] font-semibold text-brand-deep hover:underline disabled:opacity-60"
          >
            {pending ? "Sending…" : label}
          </button>
          {message}
        </span>
      ) : (
        <span className="flex items-center gap-2.5">
          <Button type="button" variant={variant} icon={icon} disabled={pending} onClick={() => (confirm ? setAsking(true) : run())}>
            {pending ? "Sending…" : label}
          </Button>
          {message}
        </span>
      )}
      {confirm && (
        <ConfirmDialog
          open={asking}
          onClose={() => setAsking(false)}
          title={confirm.title}
          description={confirm.description}
          confirmLabel={confirm.confirmLabel}
          onConfirm={async () => {
            const r = await action();
            setResult(r);
            return { ok: true };
          }}
        />
      )}
    </>
  );
}
