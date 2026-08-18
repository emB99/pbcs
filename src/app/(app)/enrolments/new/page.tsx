import { createClient } from "@/lib/supabase/server";
import { EnrolForm } from "@/components/enrolments/EnrolForm";
import { monthYearLabel } from "@/lib/dates";

export default async function NewEnrolmentPage(
  props: PageProps<"/enrolments/new">,
) {
  const searchParams = await props.searchParams;
  const initialStudentId =
    typeof searchParams.studentId === "string" ? searchParams.studentId : undefined;
  const initialIntakeId =
    typeof searchParams.intakeId === "string" ? searchParams.intakeId : undefined;

  const supabase = await createClient();
  const [{ data: students }, { data: intakes }] = await Promise.all([
    supabase
      .from("students")
      .select("id, full_name, phone")
      .is("archived_at", null)
      .order("full_name"),
    supabase
      .from("intakes")
      .select("id, label, start_date, course:courses(name, default_price)")
      .order("start_date", { ascending: false }),
  ]);

  const intakeOptions = (intakes ?? []).map((i) => ({
    id: i.id,
    label: `${i.course?.name ?? "—"} — ${i.label || monthYearLabel(i.start_date)}`,
    course_default_price: i.course?.default_price ?? 0,
  }));

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-xl font-semibold">Enrol a student</h1>
      <EnrolForm
        students={students ?? []}
        intakes={intakeOptions}
        initialStudentId={initialStudentId}
        initialIntakeId={initialIntakeId}
      />
    </div>
  );
}
