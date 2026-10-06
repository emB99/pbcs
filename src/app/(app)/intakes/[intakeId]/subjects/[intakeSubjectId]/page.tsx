import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_ROLES, requireSchool } from "@/lib/school";
import { Card, CardHead } from "@/components/ui/Card";
import { Gradebook } from "@/components/grades/Gradebook";
import { loadGradebook } from "@/lib/db/gradebook";
import { monthYearLabel } from "@/lib/dates";

export default async function IntakeSubjectMarksPage(
  props: PageProps<"/intakes/[intakeId]/subjects/[intakeSubjectId]">,
) {
  const { intakeId, intakeSubjectId } = await props.params;
  const { term: termParam } = await props.searchParams;
  const { terms: t, role } = await requireSchool();
  const supabase = await createClient();

  const { data: row } = await supabase
    .from("intake_subjects")
    .select(
      "id, subject:subjects(name, code), instructor:instructors(full_name), intake:intakes(id, label, start_date, course:courses(name))",
    )
    .eq("id", intakeSubjectId)
    .eq("intake_id", intakeId)
    .maybeSingle();
  if (!row) notFound();

  const book = await loadGradebook(intakeSubjectId, Array.isArray(termParam) ? termParam[0] : termParam);
  const intakeLabel = row.intake?.label || (row.intake ? monthYearLabel(row.intake.start_date) : "");

  return (
    <div className="flex flex-col gap-4">
      <Link
        href={`/intakes/${intakeId}`}
        className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-soft hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> {intakeLabel}
      </Link>

      <div>
        <h1 className="font-display text-xl font-semibold">{row.subject?.name}</h1>
        <p className="text-[12.5px] text-ink-soft">
          {row.intake?.course?.name} · {intakeLabel} ·{" "}
          {row.instructor?.full_name ? `${t.instructor.one}: ${row.instructor.full_name}` : `No ${t.instructor.one.toLowerCase()} assigned`}
        </p>
      </div>

      <Card>
        <CardHead title="Marks" note="Enter a mark and the grade is worked out for you" />
        <Gradebook
          key={`${intakeSubjectId}-${book.termId ?? "final"}`}
          intakeSubjectId={intakeSubjectId}
          basePath={`/intakes/${intakeId}/subjects/${intakeSubjectId}`}
          terms={book.terms}
          termId={book.termId}
          students={book.students}
          initial={book.initial}
          bands={book.bands}
          canOverrideLock={ADMIN_ROLES.includes(role)}
        />
      </Card>
    </div>
  );
}
