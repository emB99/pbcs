"use client";

import { Card, CardHead } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { CsvExportButton } from "@/components/ui/CsvExportButton";
import { InstructorRowActions } from "@/components/instructors/InstructorRowActions";
import { AddInstructorModal } from "@/components/instructors/AddInstructorModal";
import type { Instructor } from "@/lib/types";

export function InstructorsTable({ rows }: { rows: Instructor[] }) {
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
      key: "actions",
      header: "",
      align: "right",
      render: (i) => <InstructorRowActions id={i.id} name={i.full_name} />,
    },
  ];

  return (
    <Card>
      <CardHead title="All instructors" note={`${rows.length} active`}>
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
        emptyMessage="No instructors yet. Add your first instructor."
        emptyAction={<AddInstructorModal />}
      />
    </Card>
  );
}
