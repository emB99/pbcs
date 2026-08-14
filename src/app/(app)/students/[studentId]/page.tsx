import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Archive, UserPlus, CreditCard, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHead } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { LabelAboveValue } from "@/components/ui/FieldGroup";
import { BalanceWithBar } from "@/components/ui/BalanceWithBar";
import { Tag } from "@/components/ui/Tag";
import { formatDate, monthYearLabel } from "@/lib/dates";
import { StudentArchiveButton } from "@/components/students/StudentArchiveButton";
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold">{student.full_name}</h1>
          <p className="text-[12.5px] text-ink-soft">{student.phone}</p>
        </div>
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
          <Link href={`/students/${student.id}/edit`}>
            <Button icon={<Pencil />}>Edit</Button>
          </Link>
          <StudentArchiveButton id={student.id} name={student.full_name} />
        </div>
      </div>

      <Card>
        <CardHead title="Contact" note={`$${studentBalance.toFixed(2)} total balance`} />
        <div className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-3">
          <LabelAboveValue label="Full name" value={student.full_name} />
          <LabelAboveValue label="Phone" value={student.phone} />
          <LabelAboveValue label="Email" value={student.email} />
          <LabelAboveValue label="National ID" value={student.national_id} />
          <LabelAboveValue label="Address" value={student.address} />
          <LabelAboveValue label="Notes" value={student.notes} />
        </div>
      </Card>

      <Card>
        <CardHead title="Enrolments" note={`${enrolments?.length ?? 0} total`} />
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
      </Card>

      <Card>
        <CardHead title="Transaction ledger" note="Every charge, payment and adjustment" />
        <TransactionLedger transactions={transactions ?? []} />
      </Card>
    </div>
  );
}
