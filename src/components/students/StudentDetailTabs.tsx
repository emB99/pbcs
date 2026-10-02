"use client";

import { useState, type ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

export type DetailTab = { key: string; label: string; content: ReactNode };

export function StudentDetailTabs({ tabs }: { tabs: DetailTab[] }) {
  const [active, setActive] = useState(tabs[0]?.key);
  const current = tabs.find((t) => t.key === active) ?? tabs[0];

  return (
    <Card>
      <div className="flex overflow-x-auto border-b border-line-soft px-5">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActive(t.key)}
            className={cn(
              "-mb-px border-b-2 px-3 py-3.5 text-[13px] font-semibold whitespace-nowrap transition-colors",
              current?.key === t.key
                ? "border-crust text-crust-deep"
                : "border-transparent text-ink-soft hover:text-ink-mid",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      {current?.content}
    </Card>
  );
}
