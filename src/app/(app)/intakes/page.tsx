import { createClient } from "@/lib/supabase/server";
import { AddIntakeModal } from "@/components/intakes/AddIntakeModal";
import { IntakesTable, type IntakeRow } from "@/components/intakes/IntakesTable";
import type { Course, Instructor } from "@/lib/types";

export default async function IntakesPage() {
  const supabase = await createClient();

  const [{ data: intakes }, { data: summary }, { data: courses }, { data: instructors }] =
    await Promise.all([
      supabase
        .from("intakes")
        .select("id, label, start_date, end_date, course:courses(name, kind), instructor:instructors(full_name)")
        .order("start_date", { ascending: false }),
      supabase.from("intake_summary").select("*"),
      supabase
        .from("courses")
        .select("*")
        .is("archived_at", null)
        .order("name")
        .returns<Course[]>(),
      supabase
        .from("instructors")
        .select("*")
        .is("archived_at", null)
        .order("full_name")
        .returns<Instructor[]>(),
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
        <AddIntakeModal courses={courses ?? []} instructors={instructors ?? []} />
      </div>

      <IntakesTable rows={rows} courses={courses ?? []} instructors={instructors ?? []} />
    </div>
  );
}
