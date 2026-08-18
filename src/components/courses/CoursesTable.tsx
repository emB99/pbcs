"use client";

import { Card, CardHead } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { MoneyCell } from "@/components/ui/MoneyCell";
import { Tag } from "@/components/ui/Tag";
import { CsvExportButton } from "@/components/ui/CsvExportButton";
import { CourseRowActions } from "@/components/courses/CourseRowActions";
import { AddCourseModal } from "@/components/courses/AddCourseModal";
import type { Course } from "@/lib/types";

export function CoursesTable({ rows }: { rows: Course[] }) {
  const columns: Column<Course>[] = [
    {
      key: "name",
      header: "Course",
      sortValue: (c) => c.name.toLowerCase(),
      render: (c) => (
        <div>
          <div className="font-medium">{c.name}</div>
          {c.description && (
            <div className="text-[11.5px] text-ink-soft">{c.description}</div>
          )}
        </div>
      ),
    },
    {
      key: "kind",
      header: "Kind",
      sortValue: (c) => c.kind,
      render: (c) => (
        <Tag variant={c.kind === "programme" ? "due" : "ok"}>
          {c.kind === "programme" ? "Programme" : "Short course"}
        </Tag>
      ),
    },
    {
      key: "default_weeks",
      header: "Length",
      align: "right",
      sortValue: (c) => c.default_weeks ?? 0,
      render: (c) => (
        <span className="text-ink-mid">
          {c.default_weeks ? `${c.default_weeks} weeks` : "—"}
        </span>
      ),
    },
    {
      key: "default_price",
      header: "Default price",
      align: "right",
      sortValue: (c) => Number(c.default_price),
      render: (c) => <MoneyCell amount={c.default_price} />,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (c) => <CourseRowActions id={c.id} name={c.name} />,
    },
  ];

  return (
    <Card>
      <CardHead title="Catalogue" note={`${rows.length} active`}>
        <CsvExportButton
          rows={rows}
          filename="courses.csv"
          columns={[
            { header: "Name", value: (c) => c.name },
            { header: "Kind", value: (c) => c.kind },
            { header: "Default price", value: (c) => c.default_price },
            { header: "Default weeks", value: (c) => c.default_weeks ?? "" },
          ]}
        />
      </CardHead>
      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(c) => c.id}
        emptyMessage="No courses yet. Add your first course."
        emptyAction={<AddCourseModal />}
      />
    </Card>
  );
}
