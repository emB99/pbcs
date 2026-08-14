import { formatUsd, percentPaid } from "@/lib/money";
import { cn } from "@/lib/cn";

/**
 * The mockup's "signature element" — a balance figure with a thin
 * percent-paid progress bar underneath. $640 outstanding doesn't distinguish
 * a deposit-and-vanished student from a nearly-finished one; 35% vs 63% does.
 */
export function BalanceWithBar({
  balance,
  charged,
  paid,
}: {
  balance: string | number;
  charged: string | number;
  paid: string | number;
}) {
  const pct = percentPaid(charged, paid);
  const balanceNum = typeof balance === "string" ? Number(balance) : balance;
  const isOwing = balanceNum > 0;
  const isDone = pct >= 100;

  return (
    <div className="inline-flex flex-col items-end gap-[5px]">
      <span
        className={cn(
          "money font-semibold",
          isOwing ? "font-bold text-danger" : "text-ink-mid",
        )}
      >
        {formatUsd(balance)}
      </span>
      <span className="block h-1 w-[74px] overflow-hidden rounded-full bg-line">
        <i
          className={cn("block h-full rounded-full", isDone ? "bg-sage-ink" : "bg-crust")}
          style={{ width: `${pct}%` }}
        />
      </span>
      <span className="text-[10px] tracking-[0.02em] text-ink-soft">
        {pct}% paid
      </span>
    </div>
  );
}
