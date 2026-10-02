import { createClient } from "@/lib/supabase/server";
import { IntakeForm } from "@/components/intakes/IntakeForm";
import type { Course, Instructor } from "@/lib/types";
import { requireSchool } from "@/lib/school";
import { a } from "@/lib/terminology";

export default async function NewIntakePage() {
  const { terms: t } = await requireSchool();
  const supabase = await createClient();
  const [{ data: courses }, { data: instructors }] = await Promise.all([
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

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-xl font-semibold">Create {a(t.intake.one)}</h1>
      <IntakeForm courses={courses ?? []} instructors={instructors ?? []} />
    </div>
  );
}
