"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/cn";
import { EmptyState } from "@/components/ui/EmptyState";

export type Column<T> = {
  key: string;
  header: string;
  align?: "left" | "right";
  render: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
};

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  emptyMessage,
  emptyAction,
}: {
  columns: Column<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  emptyMessage: string;
  emptyAction?: ReactNode;
}) {
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);

  const sortedRows = (() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return rows;
    const sorted = [...rows].sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      if (av < bv) return -1;
      if (av > bv) return 1;
      return 0;
    });
    return sort.dir === "desc" ? sorted.reverse() : sorted;
  })();

  function toggleSort(key: string) {
    setSort((prev) => {
      if (prev?.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return null;
    });
  }

  if (rows.length === 0) {
    return <EmptyState message={emptyMessage} action={emptyAction} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[660px] border-collapse text-[13.5px]">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "border-t border-b border-line-soft bg-surface-2 px-3.5 py-2.5 text-[11px] font-[650] tracking-[0.05em] whitespace-nowrap text-ink-soft uppercase",
                  col.align === "right" ? "text-right" : "text-left",
                  col.sortValue && "cursor-pointer select-none",
                )}
                onClick={col.sortValue ? () => toggleSort(col.key) : undefined}
              >
                <span className="inline-flex items-center gap-1">
                  {col.header}
                  {sort?.key === col.key &&
                    (sort.dir === "asc" ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    ))}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row) => (
            <tr key={getRowId(row)} className="group">
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    "border-b border-line-soft px-3.5 py-[13px] align-middle group-hover:bg-[#FFF9F0] group-last:border-b-0",
                    col.align === "right" && "text-right",
                  )}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
