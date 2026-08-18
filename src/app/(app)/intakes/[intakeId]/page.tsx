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

export default async function IntakeDetailPage(
  props: PageProps<"/intakes/[intakeId]">,
) {
  const { intakeId } = await props.params;
  const supabase = await createClient();

  const { data: intake } = await supabase
    .from("intakes")
    .select(
      "id, label, start_date, end_date, capacity, course:courses(name, kind), instructor:instructors(full_name)",
    )
    .eq("id", intakeId)
    .maybeSingle();

  if (!intake) notFound();

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
        <Link href={`/enrolments/new?intakeId=${intake.id}`}>
          <Button variant="primary" icon={<UserPlus />}>
            Enrol a student
          </Button>
        </Link>
      </div>

      <Card>
        <div className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-4">
          <LabelAboveValue label="Start date" value={formatDate(intake.start_date)} />
          <LabelAboveValue label="End date" value={formatDate(intake.end_date)} />
          <LabelAboveValue label="Instructor" value={intake.instructor?.full_name} />
          <LabelAboveValue label="Capacity" value={intake.capacity?.toString()} />
        </div>
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
