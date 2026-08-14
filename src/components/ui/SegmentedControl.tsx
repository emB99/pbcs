"use client";

import { cn } from "@/lib/cn";

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  name,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
  name?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={name}
      className="flex flex-wrap gap-2 rounded-md border border-line bg-surface-2 p-1"
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded-sm px-3 py-2 text-[13px] font-semibold transition-colors",
            value === opt.value
              ? "bg-crust text-white shadow-[0_2px_6px_rgba(184,101,26,0.28)]"
              : "text-ink-mid hover:bg-surface",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
