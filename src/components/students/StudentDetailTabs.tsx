"use client";

import { useState, type ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

export function StudentDetailTabs({
  enrolmentsContent,
  ledgerContent,
  enrolmentsCount,
  transactionsCount,
}: {
  enrolmentsContent: ReactNode;
  ledgerContent: ReactNode;
  enrolmentsCount: number;
  transactionsCount: number;
}) {
  const [tab, setTab] = useState<"enrolments" | "ledger">("enrolments");

  const tabs = [
    { key: "enrolments" as const, label: `Enrolments (${enrolmentsCount})` },
    { key: "ledger" as const, label: `Ledger (${transactionsCount})` },
  ];

  return (
    <Card>
      <div className="flex border-b border-line-soft px-5">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              "-mb-px border-b-2 px-3 py-3.5 text-[13px] font-semibold transition-colors",
              tab === t.key
                ? "border-crust text-crust-deep"
                : "border-transparent text-ink-soft hover:text-ink-mid",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "enrolments" ? enrolmentsContent : ledgerContent}
    </Card>
  );
}
