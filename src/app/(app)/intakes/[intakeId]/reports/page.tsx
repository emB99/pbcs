import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_ROLES, requireSchool } from "@/lib/school";
import { Card, CardHead } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CommentsEditor } from "@/components/reports/CommentsEditor";
import { loadComments } from "@/lib/db/reports";
import { monthYearLabel } from "@/lib/dates";

/** Office view: write the class teacher's and the head's comments, then print the report cards. */
export default async function IntakeReportsPage(props: PageProps<"/intakes/[intakeId]/reports">) {
  const { intakeId } = await props.params;
  const { term: termParam } = await props.searchParams;
  const { terms: t, role } = await requireSchool();
  const supabase = await createClient();

  const { data: intake } = await supabase
    .from("intakes")
    .select("id, label, start_date, course:courses(name)")
    .eq("id", intakeId)
    .maybeSingle();
  if (!intake) notFound();

  const termValue = Array.isArray(termParam) ? termParam[0] : termParam;
  const data = await loadComments(intakeId, termValue);
  const label = intake.label || monthYearLabel(intake.start_date);
  const printHref = `/print/reports/${intakeId}${data.termId ? `?term=${data.termId}` : data.terms.length > 0 ? "?term=final" : ""}`;

  return (
    <div className="flex flex-col gap-4">
      <Link
        href={`/intakes/${intakeId}`}
        className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-soft hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> {label}
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold">Report cards</h1>
          <p className="text-[12.5px] text-ink-soft">
            {intake.course?.name} · {label}
          </p>
        </div>
        <Link href={printHref}>
          <Button variant="primary" icon={<Printer />}>
            Print all report cards
          </Button>
        </Link>
      </div>

      <Card>
        <CardHead
          title="Comments"
          note={`Marks come from the gradebook. Add a ${t.instructor.one.toLowerCase()} and head's comment for each student.`}
        />
        <CommentsEditor
          key={data.termId ?? "final"}
          basePath={`/intakes/${intakeId}/reports`}
          terms={data.terms}
          termId={data.termId}
          students={data.students}
          initial={data.initial}
          canEditHead
          canOverrideLock={ADMIN_ROLES.includes(role)}
        />
      </Card>
    </div>
  );
}
