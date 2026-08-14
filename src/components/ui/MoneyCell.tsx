import { cn } from "@/lib/cn";
import { formatUsd } from "@/lib/money";

export function MoneyCell({
  amount,
  variant = "default",
}: {
  amount: string | number;
  variant?: "default" | "muted" | "owing";
}) {
  return (
    <span
      className={cn(
        "money font-semibold",
        variant === "muted" && "font-medium text-ink-mid",
        variant === "owing" && "font-bold text-danger",
      )}
    >
      {formatUsd(amount)}
    </span>
  );
}
