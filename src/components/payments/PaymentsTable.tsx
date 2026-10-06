"use client";

import Link from "next/link";
import { Card, CardHead } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { AvatarInitials } from "@/components/ui/AvatarInitials";
import { CsvExportButton } from "@/components/ui/CsvExportButton";

import type { Transaction } from "@/lib/types";
import { methodLabel } from "@/lib/format";
import { useTerms, useFormat } from "@/components/school/SchoolProvider";

export type PaymentRow = Transaction & {
  student_id: string;
  student_name: string;
  course_name: string;
};

const KIND_LABEL: Record<Transaction["kind"], string> = {
  charge: "Charge",
  payment: "Payment",
  adjustment: "Adjustment",
};

export function PaymentsTable({ rows }: { rows: PaymentRow[] }) {
  const t = useTerms();
  const fmt = useFormat();
  const columns: Column<PaymentRow>[] = [
    {
      key: "student",
      header: "Student",
      sortValue: (r) => r.student_name.toLowerCase(),
      render: (r) => (
        <Link href={`/students/${r.student_id}`} className="flex items-center gap-2.5 hover:underline">
          <AvatarInitials id={r.student_id || r.id} name={r.student_name} size="sm" />
          <div>
            <div className="font-semibold">{r.student_name}</div>
            <div className="text-[11.5px] text-ink-soft">{r.course_name}</div>
          </div>
        </Link>
      ),
    },
    {
      key: "kind",
      header: "Kind",
      sortValue: (r) => r.kind,
      render: (r) => (
        <span>
          {KIND_LABEL[r.kind]}
          {r.reverses_id && " (reversal)"}
        </span>
      ),
    },
    {
      key: "method",
      header: "Method / reference",
      render: (r) => (
        <span className="text-ink-mid">
          {[methodLabel(r.method), r.reference].filter(Boolean).join(" · ") || "—"}
        </span>
      ),
    },
    {
      key: "document",
      header: "No.",
      sortValue: (r) => r.document_number ?? "",
      render: (r) =>
        r.document_number && (r.kind === "payment" || r.kind === "charge") ? (
          <Link
            href={`/print/${r.kind === "payment" ? "receipt" : "invoice"}/${r.id}`}
            className="text-brand-deep hover:underline"
          >
            {r.document_number}
          </Link>
        ) : (
          <span className="text-ink-soft">—</span>
        ),
    },
    {
      key: "date",
      header: "Date",
      sortValue: (r) => r.occurred_on,
      render: (r) => <span className="text-ink-mid">{fmt.date(r.occurred_on)}</span>,
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      sortValue: (r) => Number(r.amount_base),
      render: (r) => {
        const n = Number(r.amount_base);
        return (
          <span
            className={`money font-semibold ${n < 0 ? "text-success-ink" : r.reverses_id ? "text-danger" : ""}`}
          >
            {n >= 0 ? "+" : "−"}
            {fmt.money(Math.abs(n))}
          </span>
        );
      },
    },
  ];

  return (
    <Card>
      <CardHead title="All transactions" note={`${rows.length} most recent`}>
        <CsvExportButton
          rows={rows}
          filename="payments.csv"
          columns={[
            { header: "Document no.", value: (r) => r.document_number ?? "" },
            { header: "Date", value: (r) => r.occurred_on },
            { header: "Student", value: (r) => r.student_name },
            { header: t.course.one, value: (r) => r.course_name },
            { header: "Kind", value: (r) => r.kind },
            { header: "Method", value: (r) => r.method ?? "" },
            { header: "Reference", value: (r) => r.reference ?? "" },
            { header: `Amount (${fmt.currency})`, value: (r) => r.amount_base },
            { header: "Currency", value: (r) => r.currency },
            { header: "Reversal reason", value: (r) => r.reversal_reason ?? "" },
          ]}
        />
      </CardHead>
      <DataTable
        columns={columns}
        rows={rows}
        getRowId={(r) => r.id}
        emptyMessage="No payments recorded yet."
      />
    </Card>
  );
}
