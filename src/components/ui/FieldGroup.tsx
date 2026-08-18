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
      <label htmlFor={htmlFor} className="block w-full text-left text-[12.5px] font-semibold text-ink-mid">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

export const inputClass =
  "w-full rounded-full border border-line bg-surface px-4 py-[10px] text-[13.5px] text-ink shadow-[0_1px_2px_rgba(31,27,22,0.04)] outline-none transition-shadow duration-150 placeholder:text-ink-soft focus-visible:border-crust focus-visible:shadow-[0_0_0_3px_rgba(184,101,26,0.14)]";

/** Multi-line fields stay softly rounded rather than a pill, which reads badly on a tall box. */
export const textareaClass =
  "w-full rounded-lg border border-line bg-surface px-4 py-3 text-[13.5px] text-ink shadow-[0_1px_2px_rgba(31,27,22,0.04)] outline-none transition-shadow duration-150 placeholder:text-ink-soft focus-visible:border-crust focus-visible:shadow-[0_0_0_3px_rgba(184,101,26,0.14)]";
