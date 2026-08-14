import type { Database } from "@/lib/database.types";

export type Student = Database["public"]["Tables"]["students"]["Row"];
export type Instructor = Database["public"]["Tables"]["instructors"]["Row"];
export type Course = Database["public"]["Tables"]["courses"]["Row"];
export type Intake = Database["public"]["Tables"]["intakes"]["Row"];
export type Enrolment = Database["public"]["Tables"]["enrolments"]["Row"];
export type Transaction = Database["public"]["Tables"]["transactions"]["Row"];

export type EnrolmentBalance =
  Database["public"]["Views"]["enrolment_balances"]["Row"];
export type StudentBalance =
  Database["public"]["Views"]["student_balances"]["Row"];
export type IntakeSummary =
  Database["public"]["Views"]["intake_summary"]["Row"];

export type CourseKind = Database["public"]["Enums"]["course_kind"];
export type EnrolmentStatus = Database["public"]["Enums"]["enrolment_status"];
export type TxnKind = Database["public"]["Enums"]["txn_kind"];

export type PaymentMethod = "cash" | "ecocash" | "bank_transfer" | "other";

/** Returned by create/edit form actions driven by useActionState. Success redirects. */
export type FormState =
  | { errors?: Record<string, string[]>; message?: string }
  | undefined;

/** Returned by dialog-driven actions (archive, reverse, withdraw) that stay on the page. */
export type DialogResult = { ok: boolean; message?: string };
