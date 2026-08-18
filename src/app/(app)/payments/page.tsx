import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/Button";
import { PaymentsTable, type PaymentRow } from "@/components/payments/PaymentsTable";
import type { Transaction } from "@/lib/types";

export default async function PaymentsPage() {
  const supabase = await createClient();

  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(300)
    .returns<Transaction[]>();

  const enrolmentIds = [...new Set((transactions ?? []).map((t) => t.enrolment_id))];
  const { data: enrolments } = await supabase
    .from("enrolments")
    .select("id, student_id, intake:intakes(course:courses(name))")
    .in("id", enrolmentIds.length > 0 ? enrolmentIds : [""]);

  const studentIds = [...new Set((enrolments ?? []).map((e) => e.student_id))];
  const { data: students } = await supabase
    .from("students")
    .select("id, full_name")
    .in("id", studentIds.length > 0 ? studentIds : [""]);
  const studentNameById = new Map((students ?? []).map((s) => [s.id, s.full_name]));

  const enrolmentInfoById = new Map(
    (enrolments ?? []).map((e) => [
      e.id,
      { student_id: e.student_id, course_name: e.intake?.course?.name ?? "—" },
    ]),
  );

  const rows: PaymentRow[] = (transactions ?? []).map((t) => {
    const info = enrolmentInfoById.get(t.enrolment_id);
    return {
      ...t,
      student_id: info?.student_id ?? "",
      student_name: info ? (studentNameById.get(info.student_id) ?? "Unknown") : "Unknown",
      course_name: info?.course_name ?? "—",
    };
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-semibold">Payments</h1>
        <Link href="/payments/new">
          <Button variant="primary" icon={<Plus />}>
            Record a payment
          </Button>
        </Link>
      </div>

      <PaymentsTable rows={rows} />
    </div>
  );
}
