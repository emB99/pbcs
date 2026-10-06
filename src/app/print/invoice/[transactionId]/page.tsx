import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireSchool } from "@/lib/school";
import { loadDocument } from "@/lib/db/documents";
import { PrintButton } from "@/components/ui/PrintButton";
import { Letterhead } from "@/components/reports/ReportCard";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10.5px] font-semibold tracking-[0.05em] text-ink-soft uppercase">{label}</div>
      <div className="mt-0.5 text-[13px] font-medium">{value || "—"}</div>
    </div>
  );
}

export default async function InvoicePage(props: PageProps<"/print/invoice/[transactionId]">) {
  const { transactionId } = await props.params;
  const { settings, fmt } = await requireSchool();

  const doc = await loadDocument(transactionId);
  if (!doc || !doc.enrolment?.student) notFound();
  const { txn, enrolment, reversal, totals } = doc;
  const student = enrolment.student!;
  const backHref = `/students/${student.id}`;

  if (txn.kind !== "charge" || !txn.document_number) {
    return (
      <div className="rounded-lg border border-line bg-surface p-8 text-center">
        <h1 className="font-display text-lg font-semibold">No invoice for this entry</h1>
        <p className="mt-1 text-[13px] text-ink-mid">
          Invoices are issued for charges. This entry is {txn.kind === "payment" ? "a payment" : "an adjustment"}
          {txn.kind === "payment" ? ", which has a receipt instead" : ""}.
        </p>
        <Link
          href={txn.kind === "payment" ? `/print/receipt/${txn.id}` : backHref}
          className="mt-4 inline-block text-[13px] font-semibold text-brand-deep hover:underline"
        >
          {txn.kind === "payment" ? "Open the receipt" : "Back to student"}
        </Link>
      </div>
    );
  }

  const course = enrolment.intake?.course?.name ?? "";
  const intakeLabel = enrolment.intake?.label || (enrolment.intake?.start_date ? fmt.monthYear(enrolment.intake.start_date) : "");
  const description = [course, intakeLabel].filter(Boolean).join(" · ");
  const settled = totals !== null && totals.balance <= 0;

  return (
    <div>
      <div className="no-print mb-6 flex items-center justify-between">
        <Link href={backHref} className="flex items-center gap-1.5 text-[13px] font-semibold text-ink-mid hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Back to student
        </Link>
        <PrintButton label="Print invoice" />
      </div>

      <div className="rounded-lg border border-line bg-surface p-8 print:rounded-none print:border-0 print:p-0">
        {reversal && (
          <div className="mb-5 rounded-md border border-danger bg-danger-tint px-4 py-3 text-[13px] text-danger-ink">
            <strong>CANCELLED.</strong> This charge was reversed on {fmt.date(reversal.occurred_on)}
            {reversal.reversal_reason ? `: ${reversal.reversal_reason}` : "."} Nothing is owed for it.
          </div>
        )}

        <Letterhead school={settings} title="Invoice" right={`No. ${txn.document_number}`} />

        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Field label="Bill to" value={student.full_name} />
          <Field label="Student no." value={student.student_number} />
          <Field label="Invoice date" value={fmt.date(txn.occurred_on)} />
          <Field label="Phone" value={student.phone} />
          <Field label="Email" value={student.email} />
        </div>

        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-line-soft text-left text-[11px] font-semibold tracking-[0.05em] text-ink-soft uppercase">
              <th className="py-2">Description</th>
              <th className="py-2 text-right">Amount ({fmt.currency})</th>
            </tr>
          </thead>
          <tbody>
            <tr className="statement-line border-b border-line-soft">
              <td className="py-3">
                <div className="font-medium">{txn.note || "Course fee"}</div>
                {description && <div className="text-[12px] text-ink-soft">{description}</div>}
              </td>
              <td className={`money py-3 text-right font-semibold ${reversal ? "line-through" : ""}`}>
                {fmt.money(txn.amount_base)}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td className="pt-3 text-right font-semibold">Invoice total</td>
              <td className="money pt-3 text-right font-semibold">{fmt.money(txn.amount_base)}</td>
            </tr>
          </tfoot>
        </table>

        {totals && !reversal && (
          <div className="mt-6 rounded-md border border-line-soft bg-surface-2 px-5 py-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-[11px] font-semibold tracking-[0.05em] text-ink-soft uppercase">
                Account summary{course ? `: ${course}` : ""}
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  settled ? "bg-success text-success-ink" : "bg-warning text-warning-ink"
                }`}
              >
                {settled ? "Paid in full" : "Balance due"}
              </span>
            </div>
            <table className="w-full text-[13px]">
              <tbody>
                <tr>
                  <td className="py-1 text-ink-mid">Total charged</td>
                  <td className="money py-1 text-right">{fmt.money(totals.charged)}</td>
                </tr>
                <tr>
                  <td className="py-1 text-ink-mid">Paid so far</td>
                  <td className="money py-1 text-right">{fmt.money(totals.paid)}</td>
                </tr>
                <tr className="border-t border-line-soft">
                  <td className="pt-2 font-semibold">Balance due</td>
                  <td className="money pt-2 text-right font-semibold">{fmt.money(Math.max(totals.balance, 0))}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {settings.document_footer && (
          <p className="mt-8 border-t border-line-soft pt-4 text-[11.5px] whitespace-pre-line text-ink-soft">
            {settings.document_footer}
          </p>
        )}
      </div>
    </div>
  );
}
