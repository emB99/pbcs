import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PrintButton } from "@/components/ui/PrintButton";
import { formatDate, monthYearLabel, relativeDays } from "@/lib/dates";
import { percentPaid } from "@/lib/money";

export default async function OutstandingPrintPage() {
  const supabase = await createClient();

  const { data: enrolmentBalances } = await supabase
    .from("enrolment_balances")
    .select("*")
    .eq("status", "enrolled");

  const owingRows = (enrolmentBalances ?? []).filter((r) => Number(r.balance) > 0);

  const studentIds = [
    ...new Set(owingRows.map((r) => r.student_id).filter((id): id is string => id !== null)),
  ];
  const intakeIds = [
    ...new Set(owingRows.map((r) => r.intake_id).filter((id): id is string => id !== null)),
  ];
  const [{ data: students }, { data: intakes }] = await Promise.all([
    supabase.from("students").select("id, full_name, phone").in("id", studentIds.length ? studentIds : [""]),
    supabase
      .from("intakes")
      .select("id, label, start_date, course:courses(name)")
      .in("id", intakeIds.length ? intakeIds : [""]),
  ]);
  const studentById = new Map((students ?? []).map((s) => [s.id, s]));
  const intakeById = new Map((intakes ?? []).map((i) => [i.id, i]));

  const rows = owingRows
    .map((r) => {
      const s = studentById.get(r.student_id ?? "");
      const i = intakeById.get(r.intake_id ?? "");
      return {
        id: r.enrolment_id ?? "",
        full_name: s?.full_name ?? "Unknown",
        phone: s?.phone ?? "",
        course_name: i?.course?.name ?? "—",
        intake_label: i?.label || (i?.start_date ? monthYearLabel(i.start_date) : "—"),
        agreed_price: r.agreed_price ?? 0,
        paid: r.paid ?? 0,
        balance: r.balance ?? 0,
        charged: r.charged ?? 0,
        last_payment_on: r.last_payment_on,
      };
    })
    .sort((a, b) => Number(b.balance) - Number(a.balance));

  const total = rows.reduce((sum, r) => sum + Number(r.balance), 0);

  return (
    <div>
      <div className="no-print mb-6 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-[13px] font-semibold text-ink-mid hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>
        <PrintButton label="Print outstanding list" />
      </div>

      <div className="rounded-lg border border-line bg-surface p-8 print:rounded-none print:border-0 print:p-0">
        <header className="mb-8 flex items-start justify-between border-b border-line-soft pb-6">
          <div>
            <h1 className="font-display text-lg font-semibold">
              Premium Baking and Culinary School
            </h1>
            <p className="text-[12.5px] text-ink-soft">Who owes money</p>
          </div>
          <p className="text-[12.5px] text-ink-soft">{formatDate(new Date().toISOString().slice(0, 10))}</p>
        </header>

        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-line-soft text-left text-[11px] font-semibold tracking-[0.05em] text-ink-soft uppercase">
              <th className="py-2">Student</th>
              <th className="py-2">Course</th>
              <th className="py-2 text-right">Agreed</th>
              <th className="py-2 text-right">Paid</th>
              <th className="py-2 text-right">Balance</th>
              <th className="py-2 text-right">% paid</th>
              <th className="py-2">Last payment</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="py-6 text-center text-ink-soft">
                  No one owes anything right now.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="statement-line border-b border-line-soft">
                <td className="py-2 align-top">
                  <div className="font-medium">{r.full_name}</div>
                  <div className="text-ink-soft">{r.phone}</div>
                </td>
                <td className="py-2 align-top">
                  <div>{r.course_name}</div>
                  <div className="text-ink-soft">{r.intake_label}</div>
                </td>
                <td className="money py-2 text-right align-top">${Number(r.agreed_price).toFixed(2)}</td>
                <td className="money py-2 text-right align-top">${Number(r.paid).toFixed(2)}</td>
                <td className="money py-2 text-right align-top font-semibold">
                  ${Number(r.balance).toFixed(2)}
                </td>
                <td className="money py-2 text-right align-top">
                  {percentPaid(r.charged, r.paid)}%
                </td>
                <td className="py-2 align-top whitespace-nowrap">{relativeDays(r.last_payment_on)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={4} className="pt-4 text-right font-semibold">
                Total outstanding
              </td>
              <td className="money pt-4 text-right font-semibold" colSpan={3}>
                ${total.toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
