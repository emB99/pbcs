"use client";

import { cn } from "@/lib/cn";
import { useFormat } from "@/components/school/SchoolProvider";

export function MoneyCell({
  amount,
  variant = "default",
}: {
  amount: string | number;
  variant?: "default" | "muted" | "owing";
}) {
  const fmt = useFormat();
  return (
    <span
      className={cn(
        "money font-semibold",
        variant === "muted" && "font-medium text-ink-mid",
        variant === "owing" && "font-bold text-danger",
      )}
    >
      {fmt.money(amount)}
    </span>
  );
}
