"use client";

import Link from "next/link";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { AvatarInitials } from "@/components/ui/AvatarInitials";
import { BalanceWithBar } from "@/components/ui/BalanceWithBar";

export type EnrolledStudentRow = {
  enrolment_id: string;
  student_id: string;
  full_name: string;
  phone: string;
  agreed_price: number;
  charged: number;
  paid: number;
  balance: number;
};

export function EnrolledStudentsTable({
  rows,
  intakeId,
}: {
  rows: EnrolledStudentRow[];
  intakeId: string;
}) {
  const columns: Column<EnrolledStudentRow>[] = [
    {
      key: "student",
      header: "Student",
      sortValue: (r) => r.full_name.toLowerCase(),
      render: (r) => (
        <Link href={`/students/${r.student_id}`} className="flex items-center gap-2.5 hover:underline">
          <AvatarInitials id={r.student_id} name={r.full_name} />
          <div>
            <div className="font-semibold">{r.full_name}</div>
            <div className="text-[11.5px] text-ink-soft">{r.phone}</div>
          </div>
        </Link>
      ),
    },
    {
      key: "agreed_price",
      header: "Agreed",
      align: "right",
      sortValue: (r) => Number(r.agreed_price),
      render: (r) => <span className="money text-ink-mid">${Number(r.agreed_price).toFixed(2)}</span>,
    },
    {
      key: "balance",
      header: "Balance",
      align: "right",
      sortValue: (r) => Number(r.balance),
      render: (r) => <BalanceWithBar balance={r.balance} charged={r.charged} paid={r.paid} />,
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      getRowId={(r) => r.enrolment_id}
      emptyMessage="No one is enrolled in this intake yet."
      emptyAction={
        <Link href={`/enrolments/new?intakeId=${intakeId}`}>
          <Button variant="primary" icon={<UserPlus />}>
            Enrol a student
          </Button>
        </Link>
      }
    />
  );
}
