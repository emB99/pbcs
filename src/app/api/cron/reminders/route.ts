import { timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { runReminderSweep } from "@/lib/email/messages";

/**
 * Daily reminder run, called by the scheduler (vercel.json) with
 * `Authorization: Bearer $CRON_SECRET`. There is no signed-in user here, so it
 * uses the service-role client. Does nothing unless the school has switched
 * reminders on in Settings.
 */
function authorised(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const wanted = Buffer.from(`Bearer ${secret}`);
  return given.length === wanted.length && timingSafeEqual(given, wanted);
}

export async function GET(request: Request) {
  if (!authorised(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json({ error: "SUPABASE_SERVICE_ROLE_KEY is not set." }, { status: 503 });
  }

  const supabase = createAdminClient();
  const { data: settings } = await supabase.from("school_settings").select("*").maybeSingle();
  if (!settings) return Response.json({ ran: false, reason: "School is not set up." });
  if (!settings.reminders_enabled) return Response.json({ ran: false, reason: "Reminders are switched off." });

  const result = await runReminderSweep(supabase, settings, {
    repeatDays: settings.reminder_repeat_days,
    daysBefore: settings.reminder_days_before,
  });
  return Response.json({ ran: true, ...result });
}
