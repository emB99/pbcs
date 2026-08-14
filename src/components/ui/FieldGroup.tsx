import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function LabelAboveValue({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div>
      <div className="text-[11px] font-semibold tracking-[0.05em] text-ink-soft uppercase">
        {label}
      </div>
      <div className="mt-1 text-[13.5px] text-ink">{value || "—"}</div>
    </div>
  );
}

export function FieldGroup({
  label,
  htmlFor,
  error,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-[12.5px] font-semibold text-ink-mid">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

export const inputClass =
  "w-full rounded-md border border-line bg-surface px-3.5 py-2.5 text-[13.5px] text-ink outline-none placeholder:text-ink-soft focus-visible:border-crust";
