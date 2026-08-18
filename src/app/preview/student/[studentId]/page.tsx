import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChefHat, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHead } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AvatarInitials } from "@/components/ui/AvatarInitials";
import { BalanceWithBar } from "@/components/ui/BalanceWithBar";
import { Tag } from "@/components/ui/Tag";
import { TransactionLedger } from "@/components/payments/TransactionLedger";
import { monthYearLabel } from "@/lib/dates";
import type { Student, Transaction } from "@/lib/types";

export default async function StudentPortalPreviewPage(
  props: PageProps<"/preview/student/[studentId]">,
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
      "id, agreed_price, status, intake:intakes(id, label, start_date, end_date, course:courses(name, kind))",
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
  const totalBalance = (balances ?? []).reduce((sum, b) => sum + Number(b.balance), 0);
  const firstName = student.full_name.split(" ")[0];

  return (
    <div className="mx-auto flex max-w-[720px] flex-col gap-4 px-4 py-8">
      <div className="flex items-center justify-between">
        <Link
          href={`/students/${student.id}`}
          className="flex items-center gap-1.5 text-[13px] font-semibold text-ink-mid hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" /> Exit preview
        </Link>
        <span className="rounded-full border border-line bg-surface-2 px-3 py-1 text-[11px] font-semibold text-ink-soft">
          Student portal · Preview
        </span>
      </div>

      <div className="relative overflow-hidden rounded-lg bg-ink px-6 py-7">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-14 -right-14 h-44 w-44 rounded-full border-[18px] border-crust/25"
        />
        <div className="relative flex items-center gap-4">
          <div className="grid h-11 w-11 flex-none place-items-center rounded-[13px] bg-crust">
            <ChefHat className="h-5 w-5 text-white" strokeWidth={1.8} />
          </div>
          <div>
            <p className="text-[12.5px] text-surface/70">Premium Baking and Culinary School</p>
            <h1 className="font-display text-xl font-semibold text-surface">Hi, {firstName}</h1>
          </div>
        </div>
      </div>

      <Card>
        <CardHead
          title="Your balance"
          note={totalBalance > 0 ? "Across all your enrolments" : "You're all paid up"}
        />
        <div className="flex items-center gap-3 px-5 pb-5">
          <AvatarInitials id={student.id} name={student.full_name} size="lg" />
          <div>
            <div
              className={`font-display text-2xl font-semibold tabular-nums ${totalBalance > 0 ? "text-danger" : "text-sage-ink"}`}
            >
              ${totalBalance.toFixed(2)}
            </div>
            <div className="text-[12px] text-ink-soft">{student.phone}</div>
          </div>
        </div>
      </Card>

      <Card>
        <CardHead title="Your enrolments" note={`${enrolments?.length ?? 0} total`} />
        <div className="flex flex-col">
          {(enrolments ?? []).length === 0 && (
            <p className="px-5 pb-5 text-[13px] text-ink-soft">No enrolments yet.</p>
          )}
          {(enrolments ?? []).map((e) => {
            const bal = balanceByEnrolment.get(e.id);
            const intake = e.intake;
            return (
              <div
                key={e.id}
                className="flex items-center justify-between gap-3 border-t border-line-soft px-5 py-3.5 first:border-t-0"
              >
                <div className="min-w-0">
                  <div className="font-semibold">{intake?.course?.name ?? "—"}</div>
                  <div className="text-[11.5px] text-ink-soft">
                    {intake?.label || (intake?.start_date && monthYearLabel(intake.start_date))}
                    {" · "}
                    <Tag variant={e.status === "withdrawn" ? "late" : e.status === "completed" ? "ok" : "due"}>
                      {e.status}
                    </Tag>
                  </div>
                </div>
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
        <CardHead title="Payment history" note="Every charge and payment on your account" />
        <TransactionLedger transactions={transactions ?? []} readOnly />
      </Card>

      <Link href={`/print/statement/${student.id}`}>
        <Button icon={<FileText />}>View printable statement</Button>
      </Link>
    </div>
  );
}
