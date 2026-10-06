import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { requireSchool } from "@/lib/school";
import { Card, CardHead } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { AvatarInitials } from "@/components/ui/AvatarInitials";
import { Tag } from "@/components/ui/Tag";

import { Gradebook } from "@/components/grades/Gradebook";
import { loadGradebook } from "@/lib/db/gradebook";

const STATUS_VARIANT = { active: "ok", graduated: "ok", suspended: "due", withdrawn: "late" } as const;

export default async function TeachClassPage(props: PageProps<"/teach/[intakeSubjectId]">) {
  const { intakeSubjectId } = await props.params;
  const { term: termParam } = await props.searchParams;
  const { terms: t, fmt } = await requireSchool();
  const supabase = await createClient();

  const { data: classes } = await supabase.rpc("my_classes");
  const current = (classes ?? []).find((c) => c.intake_subject_id === intakeSubjectId);
  if (!current) notFound();

  const { data: roster } = await supabase.rpc("class_roster", { p_intake_subject_id: intakeSubjectId });
  const students = roster ?? [];
  const book = await loadGradebook(intakeSubjectId, Array.isArray(termParam) ? termParam[0] : termParam);

  return (
    <div className="flex flex-col gap-4">
      <Link href="/teach" className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-soft hover:text-ink">
        <ArrowLeft className="h-3.5 w-3.5" /> My classes
      </Link>

      <div>
        <h1 className="font-display text-xl font-semibold">{current.subject_name}</h1>
        <p className="text-[12.5px] text-ink-soft">
          {current.course_name} · {current.intake_label || fmt.monthYear(current.start_date)} ·{" "}
          {fmt.date(current.start_date)}
          {current.end_date ? ` – ${fmt.date(current.end_date)}` : ""}
        </p>
      </div>

      <Card>
        <CardHead title="Marks" note="Enter a mark and the grade is worked out for you" />
        <Gradebook
          key={`${intakeSubjectId}-${book.termId ?? "final"}`}
          intakeSubjectId={intakeSubjectId}
          basePath={`/teach/${intakeSubjectId}`}
          terms={book.terms}
          termId={book.termId}
          students={book.students}
          initial={book.initial}
          bands={book.bands}
          canOverrideLock={false}
        />
      </Card>

      <Card>
        <CardHead title="Roster & contacts" note={`${students.length} enrolled`} />
        {students.length === 0 ? (
          <EmptyState message={`No students are enrolled in this ${t.intake.one.toLowerCase()} yet.`} />
        ) : (
          <ul className="flex flex-col">
            {students.map((s) => (
              <li
                key={s.enrolment_id}
                className="flex items-center gap-3 border-t border-line-soft px-5 py-3 first:border-t-0"
              >
                <AvatarInitials id={s.student_id} name={s.full_name} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13.5px] font-semibold">{s.full_name}</div>
                  <div className="text-[11.5px] text-ink-soft">
                    {s.student_number}
                    {s.guardian_name && ` · ${t.guardian.one}: ${s.guardian_name}`}
                    {s.guardian_phone && ` (${s.guardian_phone})`}
                  </div>
                </div>
                {s.student_status !== "active" && (
                  <Tag variant={STATUS_VARIANT[s.student_status]}>{s.student_status}</Tag>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
