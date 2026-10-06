"use client";

import { useState, useTransition } from "react";
import { Mail, Play, Save } from "lucide-react";
import { saveReminderSettings, runRemindersNow, sendTestEmail } from "@/lib/actions/messages";
import { ActionButton } from "@/components/ui/ActionButton";
import { Button } from "@/components/ui/Button";
import { FieldGroup, inputClass } from "@/components/ui/FieldGroup";

type Settings = { enabled: boolean; daysBefore: number; repeatDays: number };

/** Automatic payment reminders, plus manual controls and a read-out of whether email is set up. */
export function RemindersForm({
  settings,
  mode,
  scheduled,
}: {
  settings: Settings;
  mode: "live" | "dry_run" | "unconfigured";
  /** True when CRON_SECRET and the service-role key are set, so the daily job can run. */
  scheduled: boolean;
}) {
  const [enabled, setEnabled] = useState(settings.enabled);
  const [daysBefore, setDaysBefore] = useState(String(settings.daysBefore));
  const [repeatDays, setRepeatDays] = useState(String(settings.repeatDays));
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      const result = await saveReminderSettings({
        reminders_enabled: enabled,
        reminder_days_before: Number(daysBefore),
        reminder_repeat_days: Number(repeatDays),
      });
      setMessage({ ok: result.ok, text: result.ok ? "Saved." : (result.message ?? "Could not save.") });
    });
  }

  return (
    <div className="flex flex-col gap-5 px-6 pb-6">
      <p
        className={`rounded-md px-4 py-3 text-[13px] ${mode === "live" ? "bg-success text-success-ink" : "bg-warning text-warning-ink"}`}
      >
        {mode === "live" && "Email is configured. Messages are sent through Resend."}
        {mode === "dry_run" &&
          "No email provider is configured, so messages are recorded in each student's Emails tab but not sent. Set RESEND_API_KEY and EMAIL_FROM to send for real."}
        {mode === "unconfigured" &&
          "Email is not configured. Set RESEND_API_KEY and EMAIL_FROM on the server; until then every send fails."}
      </p>

      <label className="flex items-center gap-2 text-[13.5px] font-semibold">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        Send payment reminders automatically
      </label>

      <div className="grid grid-cols-2 gap-4 max-[520px]:grid-cols-1">
        <FieldGroup label="Remind this many days before an instalment is due" htmlFor="days_before">
          <input
            id="days_before"
            type="number"
            min={0}
            max={30}
            value={daysBefore}
            onChange={(e) => setDaysBefore(e.target.value)}
            className={inputClass}
          />
        </FieldGroup>
        <FieldGroup label="Repeat overdue reminders every (days)" htmlFor="repeat_days">
          <input
            id="repeat_days"
            type="number"
            min={1}
            max={60}
            value={repeatDays}
            onChange={(e) => setRepeatDays(e.target.value)}
            className={inputClass}
          />
        </FieldGroup>
      </div>

      <p className="text-xs text-ink-soft">
        Each student gets at most one email per run, sent to their own address or, failing that, their guardian&apos;s.
        {enabled && !scheduled && " The daily job also needs CRON_SECRET and SUPABASE_SERVICE_ROLE_KEY set on the server; until then use “Run reminders now”."}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="primary" icon={<Save />} disabled={pending} onClick={save}>
          {pending ? "Saving…" : "Save"}
        </Button>
        {message && (
          <span role="status" className={`text-xs ${message.ok ? "text-success-ink" : "text-danger"}`}>
            {message.text}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-3 border-t border-line-soft pt-5">
        <ActionButton label="Send a test email to me" icon={<Mail />} action={sendTestEmail} />
        <ActionButton
          label="Run reminders now"
          icon={<Play />}
          action={runRemindersNow}
          confirm={{
            title: "Run the reminders now?",
            description: "This emails every student with an instalment that is overdue or due soon, using the rules above (saved ones, not unsaved edits).",
            confirmLabel: "Run now",
          }}
        />
      </div>
    </div>
  );
}
