"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/dates";
import { EmptyState } from "@/components/ui/EmptyState";
import { ReasonDialog } from "@/components/ui/ReasonDialog";
import { reverseTransaction } from "@/lib/actions/transactions";
import type { Transaction } from "@/lib/types";

const KIND_LABEL: Record<Transaction["kind"], string> = {
  charge: "Charge",
  payment: "Payment",
  adjustment: "Adjustment",
};

const METHOD_LABEL: Record<string, string> = {
  cash: "Cash",
  ecocash: "EcoCash",
  bank_transfer: "Bank transfer",
  other: "Other",
};

export function TransactionLedger({ transactions }: { transactions: Transaction[] }) {
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
        const amountNum = Number(t.amount_usd);
        const canReverse = !isReversed && !isReversal;

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
                {formatDate(t.occurred_on)}
                {t.method && ` · ${METHOD_LABEL[t.method] ?? t.method}`}
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
                  amountNum < 0 && "text-sage-ink",
                  isReversal && "text-danger",
                )}
              >
                {amountNum >= 0 ? "+" : "−"}${Math.abs(amountNum).toFixed(2)}
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
