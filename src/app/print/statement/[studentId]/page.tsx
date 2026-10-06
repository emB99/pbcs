import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PrintButton } from "@/components/ui/PrintButton";

import type { Student, Transaction } from "@/lib/types";
import { requireSchool } from "@/lib/school";
import { methodLabel } from "@/lib/format";
import { logoUrl } from "@/lib/brand";
import { SchoolLogo } from "@/components/school/SchoolLogo";

const KIND_LABEL: Record<Transaction["kind"], string> = {
  charge: "Charge",
  payment: "Payment",
  adjustment: "Adjustment",
};

export default async function StudentStatementPage(
  props: PageProps<"/print/statement/[studentId]">,
) {
  const { studentId } = await props.params;
  const { terms: t, settings: school, fmt } = await requireSchool();
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("*")
    .eq("id", studentId)
    .maybeSingle<Student>();
  if (!student) notFound();

  const { data: enrolments } = await supabase
    .from("enrolments")
    .select("id, agreed_price, intake:intakes(label, start_date, course:courses(name))")
    .eq("student_id", studentId);

  const enrolmentIds = (enrolments ?? []).map((e) => e.id);
  const courseByEnrolment = new Map(
    (enrolments ?? []).map((e) => [e.id, e.intake?.course?.name ?? "—"]),
  );

  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .in("enrolment_id", enrolmentIds.length > 0 ? enrolmentIds : [""])
    .order("occurred_on", { ascending: true })
    .order("created_at", { ascending: true })
    .returns<Transaction[]>();

  const rows = transactions ?? [];
  const closingBalance = rows.reduce((sum, t) => sum + Number(t.amount_base), 0);

  return (
    <div>
      <div className="no-print mb-6 flex items-center justify-between">
        <Link
          href={`/students/${student.id}`}
          className="flex items-center gap-1.5 text-[13px] font-semibold text-ink-mid hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" /> Back to student
        </Link>
        <PrintButton label="Print statement" />
      </div>

      <div className="rounded-lg border border-line bg-surface p-8 print:rounded-none print:border-0 print:p-0">
        <header className="mb-8 flex items-start justify-between border-b border-line-soft pb-6">
          <div className="flex items-center gap-3">
            {logoUrl(school.logo_path) && <SchoolLogo logoUrl={logoUrl(school.logo_path)} size="lg" />}
            <div>
              <h1 className="font-display text-lg font-semibold">{school.name}</h1>
              <p className="text-[12.5px] text-ink-soft">Statement of account</p>
            </div>
          </div>
          <p className="text-[12.5px] text-ink-soft">{fmt.date(fmt.today())}</p>
        </header>

        <div className="mb-6 grid grid-cols-2 gap-4 text-[13px]">
          <div>
            <div className="text-[11px] font-semibold tracking-[0.05em] text-ink-soft uppercase">
              Student
            </div>
            <div className="mt-1 font-medium">{student.full_name}</div>
            <div className="text-ink-soft">{student.phone}</div>
          </div>
        </div>

        <table className="statement-table w-full border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-line-soft text-left text-[11px] font-semibold tracking-[0.05em] text-ink-soft uppercase">
              <th className="py-2">Date</th>
              <th className="py-2">{t.course.one}</th>
              <th className="py-2">Description</th>
              <th className="py-2 text-right">Amount ({fmt.currency})</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-ink-soft">
                  No transactions on this account.
                </td>
              </tr>
            )}
            {rows.map((t) => {
              const amountNum = Number(t.amount_base);
              return (
                <tr key={t.id} className="statement-line border-b border-line-soft">
                  <td className="py-2 align-top whitespace-nowrap">{fmt.date(t.occurred_on)}</td>
                  <td className="py-2 align-top">{courseByEnrolment.get(t.enrolment_id) ?? "—"}</td>
                  <td className="py-2 align-top">
                    {KIND_LABEL[t.kind]}
                    {t.reverses_id && " (reversal)"}
                    {t.method && ` · ${methodLabel(t.method)}`}
                    {t.reference && ` · ${t.reference}`}
                    {t.reversal_reason && ` — ${t.reversal_reason}`}
                    {t.note && ` — ${t.note}`}
                  </td>
                  <td className="money py-2 text-right align-top whitespace-nowrap">
                    {amountNum >= 0 ? "" : "−"}
                    {fmt.money(Math.abs(amountNum))}
                    {t.currency !== fmt.currency && (
                      <div className="text-[11px] font-normal text-ink-soft">
                        {fmt.money(Math.abs(t.amount), t.currency)} at {t.rate_to_base}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="pt-4 text-right font-semibold">
                Closing balance
              </td>
              <td className="money pt-4 text-right font-semibold whitespace-nowrap">
                {fmt.money(closingBalance)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
