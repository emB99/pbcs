import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const VARIANTS = {
  money: {
    bg: "bg-brand-tint",
    border: "border-brand/20",
    top: "text-brand-deep",
  },
  people: {
    bg: "bg-success",
    border: "border-success-ink/15",
    top: "text-success-ink",
  },
  intake: {
    bg: "bg-info",
    border: "border-info-ink/15",
    top: "text-info-ink",
  },
} as const;

export function StatCard({
  variant,
  icon,
  label,
  value,
  sub,
}: {
  variant: keyof typeof VARIANTS;
  icon: ReactNode;
  label: string;
  value: string;
  sub?: ReactNode;
}) {
  const v = VARIANTS[variant];
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border px-[18px] pt-4 pb-[17px]",
        v.bg,
        v.border,
      )}
    >
      <div className={cn("mb-3 flex items-center gap-2", v.top)}>
        <span className="[&>svg]:h-4 [&>svg]:w-4 [&>svg]:stroke-[1.8]">
          {icon}
        </span>
        <span className="text-[11.5px] font-[650] tracking-[0.03em] uppercase">
          {label}
        </span>
      </div>
      <div className="font-display text-[31px] leading-none font-semibold tracking-[-0.02em] tabular-nums">
        {value}
      </div>
      {sub && <div className="mt-[7px] text-xs text-ink-mid">{sub}</div>}
    </div>
  );
}
