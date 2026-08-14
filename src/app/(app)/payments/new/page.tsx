import { createClient } from "@/lib/supabase/server";
import { PaymentForm, type StudentOption, type EnrolmentOption } from "@/components/payments/PaymentForm";
import { monthYearLabel } from "@/lib/dates";

export default async function NewPaymentPage(props: PageProps<"/payments/new">) {
  const searchParams = await props.searchParams;
  const initialStudentId =
    typeof searchParams.studentId === "string" ? searchParams.studentId : undefined;

  const supabase = await createClient();

  const [{ data: students }, { data: enrolments }, { data: lastZwg }] = await Promise.all([
    supabase
      .from("students")
      .select("id, full_name, phone, archived_at")
      .is("archived_at", null)
      .order("full_name"),
    supabase
      .from("enrolments")
      .select("id, student_id, intake:intakes(label, start_date, course:courses(name))")
      .eq("status", "enrolled"),
    supabase
      .from("transactions")
      .select("rate_to_usd")
      .eq("currency", "ZWG")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const studentIds = (students ?? []).map((s) => s.id);
  const { data: balances } = await supabase
    .from("student_balances")
    .select("student_id, balance")
    .in("student_id", studentIds.length > 0 ? studentIds : [""]);
  const studentBalanceById = new Map((balances ?? []).map((b) => [b.student_id, b.balance]));

  const enrolmentIds = (enrolments ?? []).map((e) => e.id);
  const { data: enrolmentBalances } = await supabase
    .from("enrolment_balances")
    .select("enrolment_id, balance")
    .in("enrolment_id", enrolmentIds.length > 0 ? enrolmentIds : [""]);
  const enrolmentBalanceById = new Map(
    (enrolmentBalances ?? []).map((b) => [b.enrolment_id, b.balance]),
  );

  const studentOptions: StudentOption[] = (students ?? []).map((s) => ({
    id: s.id,
    full_name: s.full_name,
    phone: s.phone,
    balance: studentBalanceById.get(s.id) ?? "0",
  }));

  const enrolmentOptions: EnrolmentOption[] = (enrolments ?? []).map((e) => ({
    id: e.id,
    student_id: e.student_id,
    course_name: e.intake?.course?.name ?? "—",
    intake_label: e.intake?.label || (e.intake?.start_date ? monthYearLabel(e.intake.start_date) : "—"),
    balance: enrolmentBalanceById.get(e.id) ?? "0",
  }));

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-xl font-semibold">Record a payment</h1>
      <PaymentForm
        students={studentOptions}
        enrolments={enrolmentOptions}
        lastZwgRate={lastZwg?.rate_to_usd ?? null}
        initialStudentId={initialStudentId}
      />
    </div>
  );
}
