"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Card, CardHead } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { AvatarInitials } from "@/components/ui/AvatarInitials";
import { MoneyCell } from "@/components/ui/MoneyCell";
import { Tag } from "@/components/ui/Tag";
import { SearchInput } from "@/components/ui/SearchInput";
import { CsvExportButton } from "@/components/ui/CsvExportButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { relativeDays, recencyTagVariant } from "@/lib/dates";

export type StudentRow = {
  id: string;
  full_name: string;
  phone: string;
  balance: string;
  last_payment_on: string | null;
};

const AddStudentButton = () => (
  <Link href="/students/new">
    <Button variant="primary" icon={<Plus />}>
      Add student
    </Button>
  </Link>
);

export function StudentsTable({ rows }: { rows: StudentRow[] }) {
  const [search, setSearch] = useState("");

  const normalizedSearch = search.trim().toLowerCase();
  const filtered = normalizedSearch
    ? rows.filter(
        (r) =>
          r.full_name.toLowerCase().includes(normalizedSearch) ||
          r.phone.replace(/\s+/g, "").includes(normalizedSearch.replace(/\s+/g, "")),
      )
    : rows;

  const columns: Column<StudentRow>[] = [
    {
      key: "student",
      header: "Student",
      sortValue: (r) => r.full_name.toLowerCase(),
      render: (r) => (
        <Link href={`/students/${r.id}`} className="flex items-center gap-2.5 hover:underline">
          <AvatarInitials id={r.id} name={r.full_name} />
          <div>
            <div className="font-semibold">{r.full_name}</div>
            <div className="text-[11.5px] text-ink-soft">{r.phone}</div>
          </div>
        </Link>
      ),
    },
    {
      key: "balance",
      header: "Balance",
      align: "right",
      sortValue: (r) => Number(r.balance),
      render: (r) => (
        <MoneyCell amount={r.balance} variant={Number(r.balance) > 0 ? "owing" : "muted"} />
      ),
    },
    {
      key: "last_payment",
      header: "Last payment",
      sortValue: (r) => r.last_payment_on ?? "",
      render: (r) => (
        <Tag variant={recencyTagVariant(r.last_payment_on)}>
          {relativeDays(r.last_payment_on)}
        </Tag>
      ),
    },
  ];

  return (
    <Card>
      <CardHead title="All students" note={`${rows.length} active`}>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name or phone"
          size="mini"
        />
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
      {rows.length === 0 ? (
        <EmptyState message="No students yet. Add your first student." action={<AddStudentButton />} />
      ) : filtered.length === 0 ? (
        <EmptyState message="No students match that search." />
      ) : (
        <DataTable
          columns={columns}
          rows={filtered}
          getRowId={(r) => r.id}
          emptyMessage="No students match that search."
        />
      )}
    </Card>
  );
}
