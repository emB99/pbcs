"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { useFormat } from "@/components/school/SchoolProvider";
import { methodLabel } from "@/lib/format";

import { EmptyState } from "@/components/ui/EmptyState";
import { ReasonDialog } from "@/components/ui/ReasonDialog";
import { reverseTransaction } from "@/lib/actions/transactions";
import type { Transaction } from "@/lib/types";

const KIND_LABEL: Record<Transaction["kind"], string> = {
  charge: "Charge",
  payment: "Payment",
  adjustment: "Adjustment",
};

export function TransactionLedger({
  transactions,
  readOnly = false,
}: {
  transactions: Transaction[];
  /** Hides "Reverse this" — used in the student-facing preview. */
  readOnly?: boolean;
}) {
  const fmt = useFormat();
  const [reversingId, setReversingId] = useState<string | null>(null);

  if (transactions.length === 0) {
    return <EmptyState message="No transactions yet." />;
  }

  const reversedIds = new Set(
    transactions.filter((t) => t.reverses_id).map((t) => t.reverses_id),
  );

  return (
    <div className="flex flex-col">
      {transactions.map((t) => {
        const isReversed = reversedIds.has(t.id);
        const isReversal = Boolean(t.reverses_id);
        const amountNum = Number(t.amount_base);
        const canReverse = !readOnly && !isReversed && !isReversal;

        return (
          <div
            key={t.id}
            className={cn(
              "flex items-center justify-between gap-3 border-t border-line-soft px-5 py-3 first:border-t-0",
              isReversed && "opacity-60",
            )}
          >
            <div className="min-w-0">
              <div className={cn("text-[13px] font-semibold", isReversed && "line-through")}>
                {KIND_LABEL[t.kind]}
                {isReversal && " (reversal)"}
              </div>
              <div className="text-[11.5px] text-ink-soft">
                {fmt.date(t.occurred_on)}
                {t.method && ` · ${methodLabel(t.method)}`}
                {t.reference && ` · ${t.reference}`}
                {t.reversal_reason && ` · ${t.reversal_reason}`}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {canReverse && (
                <button
                  type="button"
                  onClick={() => setReversingId(t.id)}
                  className="text-[11.5px] font-semibold text-ink-soft hover:text-danger hover:underline"
                >
                  Reverse this
                </button>
              )}
              <div
                className={cn(
                  "money text-[13px] font-semibold whitespace-nowrap",
                  isReversed && "line-through",
                  amountNum < 0 && "text-success-ink",
                  isReversal && "text-danger",
                )}
              >
                {amountNum >= 0 ? "+" : "−"}
                {fmt.money(Math.abs(amountNum))}
                {t.currency !== fmt.currency && (
                  <div className="text-[11px] font-normal text-ink-soft">
                    {fmt.money(Math.abs(t.amount), t.currency)} at {t.rate_to_base}
                  </div>
                )}
              </div>
            </div>

            {reversingId === t.id && (
              <ReasonDialog
                open
                onClose={() => setReversingId(null)}
                title="Reverse this transaction?"
                description="This inserts a mirror row with the opposite amount. Both stay visible on the ledger."
                confirmLabel="Reverse"
                onConfirm={(reason) =>
                  reverseTransaction({ transaction_id: t.id, reversal_reason: reason })
                }
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
