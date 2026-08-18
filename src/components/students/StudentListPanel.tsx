"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Card, CardHead } from "@/components/ui/Card";
import { AvatarInitials } from "@/components/ui/AvatarInitials";
import { MoneyCell } from "@/components/ui/MoneyCell";
import { SearchInput } from "@/components/ui/SearchInput";
import { CsvExportButton } from "@/components/ui/CsvExportButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { AddStudentModal } from "@/components/students/AddStudentModal";
import { cn } from "@/lib/cn";

export type StudentRow = {
  id: string;
  full_name: string;
  phone: string;
  balance: number;
  last_payment_on: string | null;
};

export function StudentListPanel({ rows }: { rows: StudentRow[] }) {
  const pathname = usePathname();
  const activeId = pathname.split("/")[2];
  const [search, setSearch] = useState("");

  const normalized = search.trim().toLowerCase();
  const filtered = normalized
    ? rows.filter(
        (r) =>
          r.full_name.toLowerCase().includes(normalized) ||
          r.phone.replace(/\s+/g, "").includes(normalized.replace(/\s+/g, "")),
      )
    : rows;

  return (
    <Card className="sticky top-[22px] flex max-h-[calc(100vh-44px)] w-[300px] flex-none flex-col max-[900px]:static max-[900px]:max-h-none max-[900px]:w-full">
      <CardHead title="Students" note={`${rows.length} active`}>
        <CsvExportButton
          rows={filtered}
          filename="students.csv"
          columns={[
            { header: "Name", value: (r) => r.full_name },
            { header: "Phone", value: (r) => r.phone },
            { header: "Balance", value: (r) => r.balance },
            { header: "Last payment", value: (r) => r.last_payment_on ?? "" },
          ]}
        />
      </CardHead>

      <div className="px-4 pb-3.5">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name or phone"
          size="mini"
        />
      </div>

      <div className="border-b border-line-soft px-4 pb-3.5">
        <AddStudentModal />
      </div>

      <div className="flex-1 overflow-y-auto">
        {rows.length === 0 ? (
          <EmptyState message="No students yet." />
        ) : filtered.length === 0 ? (
          <EmptyState message="No matches." />
        ) : (
          filtered.map((r) => (
            <Link
              key={r.id}
              href={`/students/${r.id}`}
              className={cn(
                "flex items-center gap-2.5 border-t border-line-soft px-4 py-3 first:border-t-0 hover:bg-surface-2",
                activeId === r.id && "bg-crust-tint hover:bg-crust-tint",
              )}
            >
              <AvatarInitials id={r.id} name={r.full_name} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-semibold">{r.full_name}</div>
                <div className="truncate text-[11px] text-ink-soft">{r.phone}</div>
              </div>
              <MoneyCell amount={r.balance} variant={r.balance > 0 ? "owing" : "muted"} />
            </Link>
          ))
        )}
      </div>
    </Card>
  );
}
