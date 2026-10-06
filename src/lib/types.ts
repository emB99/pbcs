import type { Database } from "@/lib/database.types";

export type Student = Database["public"]["Tables"]["students"]["Row"];
export type Instructor = Database["public"]["Tables"]["instructors"]["Row"];
export type Course = Database["public"]["Tables"]["courses"]["Row"];
export type Intake = Database["public"]["Tables"]["intakes"]["Row"];
export type Enrolment = Database["public"]["Tables"]["enrolments"]["Row"];
export type Guardian = Database["public"]["Tables"]["guardians"]["Row"];
export type StudentDocument = Database["public"]["Tables"]["student_documents"]["Row"];
export type StudentStatus = Database["public"]["Enums"]["student_status"];
export type Subject = Database["public"]["Tables"]["subjects"]["Row"];
export type Term = Database["public"]["Tables"]["terms"]["Row"];
export type IntakeSubject = Database["public"]["Tables"]["intake_subjects"]["Row"];
export type Grade = Database["public"]["Tables"]["grades"]["Row"];
export type GradeBand = Database["public"]["Tables"]["grade_scale_bands"]["Row"];
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

export type SchoolSettings = Database["public"]["Tables"]["school_settings"]["Row"];
export type Membership = Database["public"]["Tables"]["memberships"]["Row"];
export type AppRole = Database["public"]["Enums"]["app_role"];
export type SchoolType = Database["public"]["Enums"]["school_type"];
