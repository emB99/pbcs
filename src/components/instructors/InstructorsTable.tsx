"use client";

import { Card, CardHead } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Tag } from "@/components/ui/Tag";
import { CsvExportButton } from "@/components/ui/CsvExportButton";
import { InstructorRowActions } from "@/components/instructors/InstructorRowActions";
import { AddInstructorModal } from "@/components/instructors/AddInstructorModal";
import type { Instructor } from "@/lib/types";
import { useTerms } from "@/components/school/SchoolProvider";

export function InstructorsTable({ rows }: { rows: Instructor[] }) {
  const t = useTerms();
  const columns: Column<Instructor>[] = [
    {
      key: "full_name",
      header: "Name",
      sortValue: (i) => i.full_name.toLowerCase(),
      render: (i) => <span className="font-medium">{i.full_name}</span>,
    },
    {
      key: "phone",
      header: "Phone",
      render: (i) => <span className="text-ink-mid">{i.phone ?? "—"}</span>,
    },
    {
      key: "email",
      header: "Email",
      render: (i) => <span className="text-ink-mid">{i.email ?? "—"}</span>,
    },
    {
      key: "portal",
      header: "Portal login",
      render: (i) =>
        i.user_id ? <Tag variant="ok">Has access</Tag> : <span className="text-ink-soft">—</span>,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (i) => (
        <InstructorRowActions id={i.id} name={i.full_name} email={i.email} hasAccess={i.user_id !== null} />
      ),
    },
  ];

  return (
    <Card>
      <CardHead title={`All ${t.instructor.many.toLowerCase()}`} note={`${rows.length} active`}>
        <CsvExportButton
          rows={rows}
          filename="instructors.csv"
          columns={[
            { header: "Name", value: (i) => i.full_name },
            { header: "Phone", value: (i) => i.phone ?? "" },
            { header: "Email", value: (i) => i.email ?? "" },
          ]}
        />
      </CardHead>
      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(i) => i.id}
        emptyMessage={`No ${t.instructor.many.toLowerCase()} yet. Add your first ${t.instructor.one.toLowerCase()}.`}
        emptyAction={<AddInstructorModal />}
      />
    </Card>
  );
}
