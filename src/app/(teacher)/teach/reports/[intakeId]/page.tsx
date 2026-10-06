import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireSchool } from "@/lib/school";
import { Card, CardHead } from "@/components/ui/Card";
import { CommentsEditor } from "@/components/reports/CommentsEditor";
import { loadComments } from "@/lib/db/reports";


/** Class teacher view: comments for the students of a class they are in charge of. */
export default async function TeacherReportCommentsPage(props: PageProps<"/teach/reports/[intakeId]">) {
  const { intakeId } = await props.params;
  const { term: termParam } = await props.searchParams;
  const { terms: t, fmt } = await requireSchool();
  const supabase = await createClient();

  const { data: classes } = await supabase.rpc("my_form_classes");
  const current = (classes ?? []).find((c) => c.intake_id === intakeId);
  if (!current) notFound();

  const data = await loadComments(intakeId, Array.isArray(termParam) ? termParam[0] : termParam);
  const label = current.intake_label || fmt.monthYear(current.start_date);

  return (
    <div className="flex flex-col gap-4">
      <Link href="/teach" className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-soft hover:text-ink">
        <ArrowLeft className="h-3.5 w-3.5" /> My classes
      </Link>

      <div>
        <h1 className="font-display text-xl font-semibold">Report comments</h1>
        <p className="text-[12.5px] text-ink-soft">
          {current.course_name} · {label}
        </p>
      </div>

      <Card>
        <CardHead title="Comments" note={`Your comment for each student's report card (you are the ${t.instructor.one.toLowerCase()} in charge).`} />
        <CommentsEditor
          key={data.termId ?? "final"}
          basePath={`/teach/reports/${intakeId}`}
          terms={data.terms}
          termId={data.termId}
          students={data.students}
          initial={data.initial}
          canEditHead={false}
          canOverrideLock={false}
        />
      </Card>
    </div>
  );
}
