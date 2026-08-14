import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHead } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { CsvExportButton } from "@/components/ui/CsvExportButton";
import { InstructorRowActions } from "@/components/instructors/InstructorRowActions";
import type { Instructor } from "@/lib/types";

export default async function InstructorsPage() {
  const supabase = await createClient();
  const { data: instructors } = await supabase
    .from("instructors")
    .select("*")
    .is("archived_at", null)
    .order("full_name")
    .returns<Instructor[]>();

  const rows = instructors ?? [];

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
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-semibold">Instructors</h1>
        <Link href="/instructors/new">
          <Button variant="primary" icon={<Plus />}>
            Add instructor
          </Button>
        </Link>
      </div>

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
          emptyAction={
            <Link href="/instructors/new">
              <Button variant="primary" icon={<Plus />}>
                Add instructor
              </Button>
            </Link>
          }
        />
      </Card>
    </div>
  );
}
