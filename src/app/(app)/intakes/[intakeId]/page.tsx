import Link from "next/link";
import { notFound } from "next/navigation";
import { UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHead } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LabelAboveValue } from "@/components/ui/FieldGroup";
import { formatDate, monthYearLabel } from "@/lib/dates";
import {
  EnrolledStudentsTable,
  type EnrolledStudentRow,
} from "@/components/intakes/EnrolledStudentsTable";
import { requireSchool } from "@/lib/school";
import { IntakeSubjectsCard, type IntakeSubjectRow } from "@/components/intakes/IntakeSubjectsCard";
import { PromoteButton, type PromoteTarget } from "@/components/intakes/PromoteButton";

export default async function IntakeDetailPage(
  props: PageProps<"/intakes/[intakeId]">,
) {
  const { intakeId } = await props.params;
  const { terms: t, settings } = await requireSchool();
  const supabase = await createClient();

  const { data: intake } = await supabase
    .from("intakes")
    .select(
      "id, label, start_date, end_date, capacity, course_id, course:courses(name, kind), instructor:instructors(full_name)",
    )
    .eq("id", intakeId)
    .maybeSingle();

  if (!intake) notFound();

  const [{ data: intakeSubjects }, { data: courseSubjects }, { data: instructors }, { data: otherIntakes }] =
    await Promise.all([
      supabase
        .from("intake_subjects")
        .select("id, instructor_id, subject:subjects(name, code, sort_order)")
        .eq("intake_id", intakeId),
      supabase.from("subjects").select("id").eq("course_id", intake.course_id).is("archived_at", null),
      supabase.from("instructors").select("id, full_name").is("archived_at", null).order("full_name"),
      supabase
        .from("intakes")
        .select("id, label, start_date, course:courses(name, default_price)")
        .neq("id", intakeId)
        .order("start_date", { ascending: false }),
    ]);

  const subjectRows: IntakeSubjectRow[] = (intakeSubjects ?? [])
    .map((row) => ({
      id: row.id,
      subject_name: row.subject?.name ?? "Unknown",
      subject_code: row.subject?.code ?? null,
      instructor_id: row.instructor_id,
      sort: row.subject?.sort_order ?? 0,
    }))
    .sort((a, b) => a.sort - b.sort || a.subject_name.localeCompare(b.subject_name));
  const haveSubjectCount = (intakeSubjects ?? []).length;
  const missingCount = Math.max(0, (courseSubjects ?? []).length - haveSubjectCount);

  const promoteTargets: PromoteTarget[] = (otherIntakes ?? []).map((i) => ({
    id: i.id,
    label: i.label || monthYearLabel(i.start_date),
    course_name: i.course?.name ?? "Unassigned",
    default_price: Number(i.course?.default_price ?? 0),
  }));

  const { data: enrolments } = await supabase
    .from("enrolments")
    .select("id, agreed_price, status, students(id, full_name, phone)")
    .eq("intake_id", intakeId)
    .eq("status", "enrolled");

  const enrolmentIds = (enrolments ?? []).map((e) => e.id);
  const { data: balances } = await supabase
    .from("enrolment_balances")
    .select("enrolment_id, charged, paid, balance")
    .in("enrolment_id", enrolmentIds.length > 0 ? enrolmentIds : [""]);
  const balanceByEnrolment = new Map((balances ?? []).map((b) => [b.enrolment_id, b]));

  const rows: EnrolledStudentRow[] = (enrolments ?? []).map((e) => {
    const student = Array.isArray(e.students) ? e.students[0] : e.students;
    const bal = balanceByEnrolment.get(e.id);
    return {
      enrolment_id: e.id,
      student_id: student?.id ?? "",
      full_name: student?.full_name ?? "Unknown",
      phone: student?.phone ?? "",
      agreed_price: e.agreed_price,
      charged: bal?.charged ?? 0,
      paid: bal?.paid ?? 0,
      balance: bal?.balance ?? 0,
    };
  });

  const outstandingTotal = rows.reduce((sum, r) => sum + Number(r.balance), 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold">
            {intake.label || monthYearLabel(intake.start_date)}
          </h1>
          <p className="text-[12.5px] text-ink-soft">{intake.course?.name}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {settings.school_type === "k12" && (
            <PromoteButton
              sourceIntakeId={intake.id}
              students={rows.map((r) => ({ enrolment_id: r.enrolment_id, full_name: r.full_name }))}
              targets={promoteTargets}
            />
          )}
          <Link href={`/enrolments/new?intakeId=${intake.id}`}>
            <Button variant="primary" icon={<UserPlus />}>
              Enrol a student
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <div className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-4">
          <LabelAboveValue label="Start date" value={formatDate(intake.start_date)} />
          <LabelAboveValue label="End date" value={formatDate(intake.end_date)} />
          <LabelAboveValue label={`${t.instructor.one} in charge`} value={intake.instructor?.full_name} />
          <LabelAboveValue label="Capacity" value={intake.capacity?.toString()} />
        </div>
      </Card>

      <Card>
        <CardHead title={`${t.subject.many} & ${t.instructor.many.toLowerCase()}`} note="Who teaches what" />
        <IntakeSubjectsCard
          intakeId={intake.id}
          rows={subjectRows}
          instructors={instructors ?? []}
          missingCount={missingCount}
        />
      </Card>

      <Card>
        <CardHead
          title="Enrolled students"
          note={`${rows.length} active · $${outstandingTotal.toFixed(2)} outstanding`}
        />
        <EnrolledStudentsTable rows={rows} intakeId={intake.id} />
      </Card>
    </div>
  );
}
