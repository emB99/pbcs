"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_ROLES, NOT_ALLOWED, getOfficeContext, requireSchool } from "@/lib/school";
import { runReminderSweep, sendBalanceReminder, sendReceipt, sendTest, type SendResult } from "@/lib/email/messages";
import type { DialogResult } from "@/lib/types";

function refresh() {
  revalidatePath("/students/[studentId]", "page");
  revalidatePath("/dashboard");
}

/** One plain sentence for a single send, shown under the button that triggered it. */
function describe(r: SendResult): DialogResult {
  switch (r.status) {
    case "sent":
      return r.error ? { ok: true, message: r.error } : { ok: true, message: `Email sent to ${r.to}.` };
    case "dry_run":
      return { ok: true, message: `Recorded for ${r.to}. Nothing was sent because no email provider is configured yet.` };
    case "skipped":
      return { ok: false, message: "There is no email address on file for this student or their guardians." };
    default:
      return { ok: false, message: r.error ?? "The email could not be sent." };
  }
}

export async function emailReceipt(transactionId: string): Promise<DialogResult> {
  const ctx = await getOfficeContext();
  if (!ctx) return { ok: false, message: NOT_ALLOWED };
  const supabase = await createClient();
  const result = await sendReceipt(supabase, ctx.settings, transactionId);
  if (!result) return { ok: false, message: "Only payments that have not been reversed have a receipt to email." };
  refresh();
  return describe(result);
}

export async function emailBalanceReminder(studentId: string): Promise<DialogResult> {
  const ctx = await getOfficeContext();
  if (!ctx) return { ok: false, message: NOT_ALLOWED };
  const supabase = await createClient();
  const result = await sendBalanceReminder(supabase, ctx.settings, studentId);
  if (!result) return { ok: false, message: "This student has no outstanding balance to remind about." };
  refresh();
  return describe(result);
}

function summary(r: Awaited<ReturnType<typeof runReminderSweep>>): DialogResult {
  if (r.students === 0) return { ok: true, message: "Nobody needed a reminder right now." };
  const parts = [
    r.sent > 0 && `${r.sent} sent`,
    r.dryRun > 0 && `${r.dryRun} recorded but not sent (no email provider configured)`,
    r.skipped > 0 && `${r.skipped} skipped for lack of an email address`,
    r.failed > 0 && `${r.failed} failed`,
  ].filter(Boolean);
  return { ok: r.failed === 0, message: `${parts.join(", ")}.` };
}

/** The dashboard's "Remind all": overdue instalments only, at most one email per student per day. */
export async function remindOverdue(): Promise<DialogResult> {
  const ctx = await getOfficeContext();
  if (!ctx) return { ok: false, message: NOT_ALLOWED };
  const supabase = await createClient();
  const result = await runReminderSweep(supabase, ctx.settings, { repeatDays: 1, daysBefore: null });
  refresh();
  return summary(result);
}

/** Settings → Reminders: the same pass the daily job makes, using the school's own rules. */
export async function runRemindersNow(): Promise<DialogResult> {
  const ctx = await requireSchool();
  if (!ADMIN_ROLES.includes(ctx.role)) return { ok: false, message: NOT_ALLOWED };
  const supabase = await createClient();
  const result = await runReminderSweep(supabase, ctx.settings, {
    repeatDays: ctx.settings.reminder_repeat_days,
    daysBefore: ctx.settings.reminder_days_before,
  });
  refresh();
  return summary(result);
}

export async function sendTestEmail(): Promise<DialogResult> {
  const ctx = await requireSchool();
  if (!ADMIN_ROLES.includes(ctx.role)) return { ok: false, message: NOT_ALLOWED };
  if (!ctx.email) return { ok: false, message: "Your account has no email address." };
  const supabase = await createClient();
  const result = await sendTest(supabase, ctx.settings, ctx.email);
  return describe(result);
}

const reminderSchema = z.object({
  reminders_enabled: z.boolean(),
  reminder_days_before: z
    .number({ message: "Enter how many days before." })
    .int("Use a whole number of days.")
    .min(0, "Use 0 to 30 days before.")
    .max(30, "Use 0 to 30 days before."),
  reminder_repeat_days: z
    .number({ message: "Enter how many days between reminders." })
    .int("Use a whole number of days.")
    .min(1, "Use 1 to 60 days between reminders.")
    .max(60, "Use 1 to 60 days between reminders."),
});

export async function saveReminderSettings(input: z.input<typeof reminderSchema>): Promise<DialogResult> {
  const ctx = await requireSchool();
  if (!ADMIN_ROLES.includes(ctx.role)) return { ok: false, message: NOT_ALLOWED };

  const parsed = reminderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the details." };

  const supabase = await createClient();
  const { error } = await supabase.from("school_settings").update(parsed.data).eq("id", true);
  if (error) return { ok: false, message: "Could not save. Try again." };

  revalidatePath("/settings");
  return { ok: true };
}
