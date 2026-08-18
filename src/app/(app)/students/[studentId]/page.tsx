import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, UserPlus, CreditCard, FileText, Eye } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHead } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { LabelAboveValue } from "@/components/ui/FieldGroup";
import { BalanceWithBar } from "@/components/ui/BalanceWithBar";
import { Tag } from "@/components/ui/Tag";
import { monthYearLabel } from "@/lib/dates";
import { StudentArchiveButton } from "@/components/students/StudentArchiveButton";
import { StudentBanner } from "@/components/students/StudentBanner";
import { StudentDetailTabs } from "@/components/students/StudentDetailTabs";
import { WithdrawButton } from "@/components/enrolments/WithdrawButton";
import { AddChargeButton } from "@/components/enrolments/AddChargeButton";
import { TransactionLedger } from "@/components/payments/TransactionLedger";
import type { Student, Transaction } from "@/lib/types";

export default async function StudentDetailPage(
  props: PageProps<"/students/[studentId]">,
) {
  const { studentId } = await props.params;
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("*")
    .eq("id", studentId)
    .maybeSingle<Student>();

  if (!student) notFound();

  const { data: enrolments } = await supabase
    .from("enrolments")
    .select(
      "id, agreed_price, status, price_note, enrolled_on, intake:intakes(id, label, start_date, course:courses(name, kind))",
    )
    .eq("student_id", studentId)
    .order("enrolled_on", { ascending: false });

  const enrolmentIds = (enrolments ?? []).map((e) => e.id);

  const [{ data: balances }, { data: transactions }] = await Promise.all([
    supabase
      .from("enrolment_balances")
      .select("enrolment_id, charged, paid, balance")
      .in("enrolment_id", enrolmentIds.length > 0 ? enrolmentIds : [""]),
    supabase
      .from("transactions")
      .select("*")
      .in("enrolment_id", enrolmentIds.length > 0 ? enrolmentIds : [""])
      .order("occurred_on", { ascending: false })
      .order("created_at", { ascending: false })
      .returns<Transaction[]>(),
  ]);

  const balanceByEnrolment = new Map((balances ?? []).map((b) => [b.enrolment_id, b]));
  const studentBalance = (balances ?? []).reduce((sum, b) => sum + Number(b.balance), 0);

  const enrolmentsContent = (
    <div className="flex flex-col">
      {(enrolments ?? []).length === 0 && (
        <EmptyState
          message="Not enrolled in anything yet."
          action={
            <Link href={`/enrolments/new?studentId=${student.id}`}>
              <Button variant="primary" icon={<UserPlus />}>
                Enrol {student.full_name.split(" ")[0]}
              </Button>
            </Link>
          }
        />
      )}
      {(enrolments ?? []).map((e) => {
        const bal = balanceByEnrolment.get(e.id);
        const intake = e.intake;
        return (
          <div
            key={e.id}
            className="flex items-center justify-between gap-3 border-t border-line-soft px-5 py-3.5 first:border-t-0"
          >
            <Link
              href={intake?.id ? `/intakes/${intake.id}` : "#"}
              className="min-w-0 flex-1 hover:opacity-80"
            >
              <div className="font-semibold">{intake?.course?.name ?? "—"}</div>
              <div className="text-[11.5px] text-ink-soft">
                {intake?.label || (intake?.start_date && monthYearLabel(intake.start_date))}
                {" · "}
                <Tag variant={e.status === "withdrawn" ? "late" : e.status === "completed" ? "ok" : "due"}>
                  {e.status}
                </Tag>
              </div>
            </Link>
            {e.status === "enrolled" && (
              <div className="flex flex-col items-end gap-1">
                <AddChargeButton
                  enrolmentId={e.id}
                  courseName={intake?.course?.name ?? "this enrolment"}
                />
                <WithdrawButton
                  enrolmentId={e.id}
                  studentName={student.full_name}
                  balance={Number(bal?.balance ?? 0)}
                />
              </div>
            )}
            <BalanceWithBar
              balance={bal?.balance ?? "0"}
              charged={bal?.charged ?? "0"}
              paid={bal?.paid ?? "0"}
            />
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <StudentBanner
        id={student.id}
        name={student.full_name}
        phone={student.phone}
        enrolmentCount={enrolments?.length ?? 0}
        balance={studentBalance}
      />

      <div className="flex flex-wrap gap-2">
        <Link href={`/payments/new?studentId=${student.id}`}>
          <Button variant="primary" icon={<CreditCard />}>
            Record a payment
          </Button>
        </Link>
        <Link href={`/enrolments/new?studentId=${student.id}`}>
          <Button icon={<UserPlus />}>Enrol</Button>
        </Link>
        <Link href={`/print/statement/${student.id}`}>
          <Button icon={<FileText />}>Statement</Button>
        </Link>
        <Link href={`/preview/student/${student.id}`}>
          <Button icon={<Eye />}>Preview student view</Button>
        </Link>
        <Link href={`/students/${student.id}/edit`}>
          <Button icon={<Pencil />}>Edit</Button>
        </Link>
        <StudentArchiveButton id={student.id} name={student.full_name} />
      </div>

      <Card>
        <CardHead title="Basic details" />
        <div className="grid grid-cols-2 gap-4 p-5">
          <LabelAboveValue label="Email" value={student.email} />
          <LabelAboveValue label="National ID" value={student.national_id} />
          <LabelAboveValue label="Address" value={student.address} />
          <LabelAboveValue label="Notes" value={student.notes} />
        </div>
      </Card>

      <StudentDetailTabs
        enrolmentsCount={enrolments?.length ?? 0}
        transactionsCount={transactions?.length ?? 0}
        enrolmentsContent={enrolmentsContent}
        ledgerContent={<TransactionLedger transactions={transactions ?? []} />}
      />
    </div>
  );
}
