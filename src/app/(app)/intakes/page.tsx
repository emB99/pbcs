import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import { IntakesTable, type IntakeRow } from "@/components/intakes/IntakesTable";

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
      outstanding: s?.outstanding ?? 0,
    };
  });

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

      <IntakesTable rows={rows} />
    </div>
  );
}
