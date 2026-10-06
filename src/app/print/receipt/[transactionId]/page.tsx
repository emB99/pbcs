import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireSchool } from "@/lib/school";
import { loadDocument } from "@/lib/db/documents";
import { methodLabel } from "@/lib/format";
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

export default async function ReceiptPage(props: PageProps<"/print/receipt/[transactionId]">) {
  const { transactionId } = await props.params;
  const { settings, fmt } = await requireSchool();

  const doc = await loadDocument(transactionId);
  if (!doc || !doc.enrolment?.student) notFound();
  const { txn, enrolment, reversal, balanceAfter } = doc;
  const student = enrolment.student!;
  const backHref = `/students/${student.id}`;

  if (txn.kind !== "payment" || !txn.document_number) {
    return (
      <div className="rounded-lg border border-line bg-surface p-8 text-center">
        <h1 className="font-display text-lg font-semibold">No receipt for this entry</h1>
        <p className="mt-1 text-[13px] text-ink-mid">
          Receipts are issued for payments. This entry is {txn.kind === "charge" ? "a charge" : "an adjustment"}
          {txn.kind === "charge" ? ", which has an invoice instead" : ""}.
        </p>
        <Link
          href={txn.kind === "charge" ? `/print/invoice/${txn.id}` : backHref}
          className="mt-4 inline-block text-[13px] font-semibold text-brand-deep hover:underline"
        >
          {txn.kind === "charge" ? "Open the invoice" : "Back to student"}
        </Link>
      </div>
    );
  }

  const paid = Math.abs(Number(txn.amount));
  const paidBase = Math.abs(Number(txn.amount_base));
  const foreign = txn.currency !== fmt.currency;
  const course = enrolment.intake?.course?.name ?? "";
  const intakeLabel = enrolment.intake?.label || (enrolment.intake?.start_date ? fmt.monthYear(enrolment.intake.start_date) : "");

  return (
    <div>
      <div className="no-print mb-6 flex items-center justify-between">
        <Link href={backHref} className="flex items-center gap-1.5 text-[13px] font-semibold text-ink-mid hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Back to student
        </Link>
        <PrintButton label="Print receipt" />
      </div>

      <div className="relative rounded-lg border border-line bg-surface p-8 print:rounded-none print:border-0 print:p-0">
        {reversal && (
          <div className="mb-5 rounded-md border border-danger bg-danger-tint px-4 py-3 text-[13px] text-danger-ink">
            <strong>VOID.</strong> This payment was reversed on {fmt.date(reversal.occurred_on)}
            {reversal.reversal_reason ? `: ${reversal.reversal_reason}` : "."} It no longer counts towards the balance.
          </div>
        )}

        <Letterhead school={settings} title="Receipt" right={`No. ${txn.document_number}`} />

        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Field label="Received from" value={student.full_name} />
          <Field label="Student no." value={student.student_number} />
          <Field label="Date paid" value={fmt.date(txn.occurred_on)} />
          <Field label="For" value={[course, intakeLabel].filter(Boolean).join(" · ")} />
          <Field label="Method" value={methodLabel(txn.method)} />
          <Field label="Reference" value={txn.reference} />
        </div>

        <div className="rounded-md border border-line-soft bg-surface-2 px-5 py-4">
          <div className="text-[11px] font-semibold tracking-[0.05em] text-ink-soft uppercase">Amount received</div>
          <div className={`font-display mt-1 text-[28px] font-semibold tabular-nums ${reversal ? "line-through" : ""}`}>
            {fmt.money(paid, txn.currency)}
          </div>
          {foreign && (
            <div className="mt-0.5 text-[12.5px] text-ink-mid">
              Equivalent to {fmt.money(paidBase)} at an exchange rate of {txn.rate_to_base} {txn.currency} per{" "}
              {fmt.currency}
            </div>
          )}
        </div>

        <table className="mt-5 w-full border-collapse text-[13px]">
          <tbody>
            <tr className="border-b border-line-soft">
              <td className="py-2 text-ink-mid">Credited to the account ({fmt.currency})</td>
              <td className="money py-2 text-right font-semibold">{fmt.money(paidBase)}</td>
            </tr>
            <tr>
              <td className="py-2 text-ink-mid">Balance on this {course ? "enrolment" : "account"} after this payment</td>
              <td className="money py-2 text-right font-semibold">
                {balanceAfter <= 0 ? (balanceAfter < 0 ? `${fmt.money(Math.abs(balanceAfter))} in credit` : "Paid in full") : fmt.money(balanceAfter)}
              </td>
            </tr>
          </tbody>
        </table>

        {txn.note && <p className="mt-4 text-[12.5px] text-ink-mid">Note: {txn.note}</p>}

        <div className="mt-10 grid grid-cols-2 gap-8 text-[12px] text-ink-soft">
          <div className="border-t border-ink-soft pt-1.5">Received by</div>
          <div className="border-t border-ink-soft pt-1.5">Date</div>
        </div>

        {settings.document_footer && (
          <p className="mt-6 border-t border-line-soft pt-4 text-[11.5px] whitespace-pre-line text-ink-soft">
            {settings.document_footer}
          </p>
        )}
      </div>
    </div>
  );
}
