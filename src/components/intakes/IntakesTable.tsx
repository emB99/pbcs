"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Card, CardHead } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { MoneyCell } from "@/components/ui/MoneyCell";
import { Tag } from "@/components/ui/Tag";
import { CsvExportButton } from "@/components/ui/CsvExportButton";
import { formatDate, monthYearLabel } from "@/lib/dates";

export type IntakeRow = {
  id: string;
  label: string | null;
  start_date: string;
  end_date: string | null;
  course: { name: string; kind: "short_course" | "programme" } | null;
  instructor: { full_name: string } | null;
  active_students: number;
  outstanding: number;
};

export function IntakesTable({ rows }: { rows: IntakeRow[] }) {
  const columns: Column<IntakeRow>[] = [
    {
      key: "label",
      header: "Intake",
      sortValue: (r) => r.start_date,
      render: (r) => (
        <Link href={`/intakes/${r.id}`} className="block hover:underline">
          <div className="font-medium">{r.label || monthYearLabel(r.start_date)}</div>
          <div className="text-[11.5px] text-ink-soft">{r.course?.name ?? "—"}</div>
        </Link>
      ),
    },
    {
      key: "kind",
      header: "Kind",
      sortValue: (r) => r.course?.kind ?? "",
      render: (r) => (
        <Tag variant={r.course?.kind === "programme" ? "due" : "ok"}>
          {r.course?.kind === "programme" ? "Programme" : "Short course"}
        </Tag>
      ),
    },
    {
      key: "dates",
      header: "Dates",
      sortValue: (r) => r.start_date,
      render: (r) => (
        <span className="text-ink-mid">
          {formatDate(r.start_date)}
          {r.end_date ? ` – ${formatDate(r.end_date)}` : ""}
        </span>
      ),
    },
    {
      key: "instructor",
      header: "Instructor",
      sortValue: (r) => r.instructor?.full_name ?? "",
      render: (r) => <span className="text-ink-mid">{r.instructor?.full_name ?? "—"}</span>,
    },
    {
      key: "students",
      header: "Students",
      align: "right",
      sortValue: (r) => r.active_students,
      render: (r) => <span className="tabular-nums">{r.active_students}</span>,
    },
    {
      key: "outstanding",
      header: "Outstanding",
      align: "right",
      sortValue: (r) => Number(r.outstanding),
      render: (r) => (
        <MoneyCell amount={r.outstanding} variant={Number(r.outstanding) > 0 ? "owing" : "muted"} />
      ),
    },
  ];

  return (
    <Card>
      <CardHead title="All intakes" note={`${rows.length} total`}>
        <CsvExportButton
          rows={rows}
          filename="intakes.csv"
          columns={[
            { header: "Intake", value: (r) => r.label || monthYearLabel(r.start_date) },
            { header: "Course", value: (r) => r.course?.name ?? "" },
            { header: "Start date", value: (r) => r.start_date },
            { header: "End date", value: (r) => r.end_date ?? "" },
            { header: "Instructor", value: (r) => r.instructor?.full_name ?? "" },
            { header: "Active students", value: (r) => r.active_students },
            { header: "Outstanding", value: (r) => r.outstanding },
          ]}
        />
      </CardHead>
      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(r) => r.id}
        emptyMessage="No intakes yet. Create your first intake."
        emptyAction={
          <Link href="/intakes/new">
            <Button variant="primary" icon={<Plus />}>
              Create intake
            </Button>
          </Link>
        }
      />
    </Card>
  );
}
