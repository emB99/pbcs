import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { THEMES, isHexColor, logoUrl, onBrandColor } from "@/lib/brand";
import type { MessageStatus, SchoolSettings } from "@/lib/types";
import type { EmailBrand, RenderedEmail } from "@/lib/email/templates";

type Db = SupabaseClient<Database>;
export type MessageKind = Database["public"]["Tables"]["messages"]["Row"]["kind"];

/**
 * What the server can do with email right now.
 *   live          RESEND_API_KEY and EMAIL_FROM are set: messages really go out.
 *   dry_run       no key, development: messages are recorded but not sent.
 *   unconfigured  no key (or no sender) in production: sending fails with a clear error.
 */
export function emailMode(): "live" | "dry_run" | "unconfigured" {
  if (process.env.RESEND_API_KEY && process.env.EMAIL_FROM) return "live";
  if (!process.env.RESEND_API_KEY && process.env.NODE_ENV !== "production") return "dry_run";
  return "unconfigured";
}

export function emailBrand(settings: SchoolSettings): EmailBrand {
  const theme = THEMES.find((t) => t.id === settings.theme) ?? THEMES[0];
  const brandColor = settings.brand_color && isHexColor(settings.brand_color) ? settings.brand_color : theme.brand;
  return {
    name: settings.name,
    logoUrl: logoUrl(settings.logo_path),
    brandColor,
    onBrand: onBrandColor(brandColor),
    email: settings.email,
    phone: settings.phone,
    footer: settings.document_footer,
  };
}

/** The address to write to for a student: their own, else the primary guardian's, else any guardian's. */
export async function resolveRecipient(supabase: Db, studentId: string): Promise<string | null> {
  const [{ data: student }, { data: guardians }] = await Promise.all([
    supabase.from("students").select("email").eq("id", studentId).maybeSingle(),
    supabase
      .from("guardians")
      .select("email, is_primary")
      .eq("student_id", studentId)
      .not("email", "is", null)
      .order("is_primary", { ascending: false }),
  ]);
  const own = student?.email?.trim();
  if (own) return own;
  return guardians?.map((g) => g.email?.trim()).find(Boolean) ?? null;
}

type Sent = { ok: true; id: string | null } | { ok: false; error: string };

async function postToResend(brand: EmailBrand, to: string, mail: RenderedEmail): Promise<Sent> {
  const fromName = brand.name.replace(/[<>"\r\n]/g, "").trim() || "School";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${fromName} <${process.env.EMAIL_FROM}>`,
        to: [to],
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
        ...(brand.email ? { reply_to: brand.email } : {}),
      }),
    });
    const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!res.ok) return { ok: false, error: body.message ?? `Email provider returned ${res.status}.` };
    return { ok: true, id: body.id ?? null };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not reach the email provider." };
  }
}

export type DeliveryTarget = {
  kind: MessageKind;
  studentId: string | null;
  enrolmentId?: string | null;
  refId?: string | null;
  /** The recipient, or null when the student has no address (recorded as skipped). */
  to: string | null;
};

export type Delivery = { status: MessageStatus; error: string | null };

/**
 * Sends one message and records it in the `messages` log, whatever happened.
 * Never throws: failures come back as a status so a bulk run can carry on.
 */
export async function deliver(supabase: Db, brand: EmailBrand, target: DeliveryTarget, mail: RenderedEmail): Promise<Delivery> {
  let status: MessageStatus;
  let error: string | null = null;
  let providerId: string | null = null;

  if (!target.to) {
    status = "skipped";
    error = "No email address on file for the student or a guardian.";
  } else {
    const mode = emailMode();
    if (mode === "dry_run") {
      status = "dry_run";
    } else if (mode === "unconfigured") {
      status = "failed";
      error = "Email is not configured. Set RESEND_API_KEY and EMAIL_FROM.";
    } else {
      const sent = await postToResend(brand, target.to, mail);
      status = sent.ok ? "sent" : "failed";
      if (sent.ok) providerId = sent.id;
      else error = sent.error;
    }
  }

  const { error: logError } = await supabase.from("messages").insert({
    student_id: target.studentId,
    enrolment_id: target.enrolmentId ?? null,
    kind: target.kind,
    ref_id: target.refId ?? null,
    to_email: target.to,
    subject: mail.subject,
    status,
    provider_id: providerId,
    error,
  });
  // The email may already be out; surface a logging problem without pretending it failed.
  if (logError && status !== "failed") error = `Sent, but the history entry could not be saved: ${logError.message}`;
  return { status, error };
}
