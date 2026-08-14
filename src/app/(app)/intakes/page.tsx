import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHead } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { MoneyCell } from "@/components/ui/MoneyCell";
import { Tag } from "@/components/ui/Tag";
import { CsvExportButton } from "@/components/ui/CsvExportButton";
import { formatDate, monthYearLabel } from "@/lib/dates";

type IntakeRow = {
  id: string;
  label: string | null;
  start_date: string;
  end_date: string | null;
  course: { name: string; kind: "short_course" | "programme" } | null;
  instructor: { full_name: string } | null;
  active_students: number;
  outstanding: string;
};

export default async function IntakesPage() {
  const supabase = await createClient();

  const [{ data: intakes }, { data: summary }] = await Promise.all([
    supabase
      .from("intakes")
      .select("id, label, start_date, end_date, course:courses(name, kind), instructor:instructors(full_name)")
      .order("start_date", { ascending: false }),
    supabase.from("intake_summary").select("*"),
  ]);

  const summaryById = new Map((summary ?? []).map((s) => [s.intake_id, s]));

  const rows: IntakeRow[] = (intakes ?? []).map((i) => {
    const s = summaryById.get(i.id);
    return {
      id: i.id,
      label: i.label,
      start_date: i.start_date,
      end_date: i.end_date,
      course: i.course,
      instructor: i.instructor,
      active_students: s?.active_students ?? 0,
      outstanding: s?.outstanding ?? "0",
    };
  });

  const columns: Column<IntakeRow>[] = [
    {
      key: "label",
      header: "Intake",
      sortValue: (r) => r.start_date,
      render: (r) => (
        <Link href={`/intakes/${r.id}`} className="block hover:underline">
          <div className="font-medium">{r.label || monthYearLabel(r.start_date)}</div>
          <div className="text-[11.5px] text-ink-soft">
            {r.course?.name ?? "—"}
          </div>
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
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-semibold">Intakes</h1>
        <Link href="/intakes/new">
          <Button variant="primary" icon={<Plus />}>
            Create intake
          </Button>
        </Link>
      </div>

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
    </div>
  );
}
