"use client";

import Link from "next/link";
import { Card, CardHead } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { MoneyCell } from "@/components/ui/MoneyCell";
import { Tag } from "@/components/ui/Tag";
import { CsvExportButton } from "@/components/ui/CsvExportButton";
import { AddIntakeModal } from "@/components/intakes/AddIntakeModal";
import { formatDate, monthYearLabel } from "@/lib/dates";
import type { Course, Instructor } from "@/lib/types";
import { useTerms, useSchoolType } from "@/components/school/SchoolProvider";

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

export function IntakesTable({
  rows,
  courses = [],
  instructors = [],
}: {
  rows: IntakeRow[];
  courses?: Course[];
  instructors?: Instructor[];
}) {
  const t = useTerms();
  const isK12 = useSchoolType() === "k12";
  const allColumns: Column<IntakeRow>[] = [
    {
      key: "label",
      header: t.intake.one,
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
      header: `${t.instructor.one} in charge`,
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
  const columns = allColumns.filter((col) => !(isK12 && col.key === "kind"));

  return (
    <Card>
      <CardHead title={`All ${t.intake.many.toLowerCase()}`} note={`${rows.length} total`}>
        <CsvExportButton
          rows={rows}
          filename="intakes.csv"
          columns={[
            { header: t.intake.one, value: (r) => r.label || monthYearLabel(r.start_date) },
            { header: t.course.one, value: (r) => r.course?.name ?? "" },
            { header: "Start date", value: (r) => r.start_date },
            { header: "End date", value: (r) => r.end_date ?? "" },
            { header: t.instructor.one, value: (r) => r.instructor?.full_name ?? "" },
            { header: "Active students", value: (r) => r.active_students },
            { header: "Outstanding", value: (r) => r.outstanding },
          ]}
        />
      </CardHead>
      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(r) => r.id}
        emptyMessage={`No ${t.intake.many.toLowerCase()} yet. Create your first ${t.intake.one.toLowerCase()}.`}
        emptyAction={<AddIntakeModal courses={courses} instructors={instructors} />}
      />
    </Card>
  );
}
