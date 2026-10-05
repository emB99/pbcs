"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ADMIN_ROLES, NOT_ALLOWED, requireSchool } from "@/lib/school";
import type { DialogResult } from "@/lib/types";

function siteOrigin() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

const MESSAGES: Record<string, string> = {
  no_email: "Add an email address to this record first. The login is matched by email.",
  has_other_role: "That email already belongs to someone with a different role at this school.",
  already_linked: "That login is already linked to another record.",
};

/**
 * Gives an instructor a teacher login. If an account with the instructor's
 * email already exists it is linked straight away; otherwise an invite email is
 * sent (this part needs SUPABASE_SERVICE_ROLE_KEY) and the account is linked.
 */
export async function grantTeacherAccess(instructorId: string): Promise<DialogResult> {
  const ctx = await requireSchool();
  if (!ADMIN_ROLES.includes(ctx.role)) return { ok: false, message: NOT_ALLOWED };

  const supabase = await createClient();
  const first = await supabase.rpc("grant_teacher_access", { p_instructor_id: instructorId });
  if (first.error) return { ok: false, message: "Could not give access. Try again." };

  let outcome = first.data;
  if (outcome === "no_account") {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return {
        ok: false,
        message:
          "No account exists for that email yet, and sending invites needs SUPABASE_SERVICE_ROLE_KEY in .env.local. Ask them to sign in once, then try again.",
      };
    }
    const { data: instructor } = await supabase
      .from("instructors")
      .select("email")
      .eq("id", instructorId)
      .maybeSingle();
    if (!instructor?.email) return { ok: false, message: MESSAGES.no_email };

    const { error: inviteError } = await createAdminClient().auth.admin.inviteUserByEmail(
      instructor.email,
      { redirectTo: `${siteOrigin()}/reset-password` },
    );
    if (inviteError) return { ok: false, message: "Could not send the invite. Try again." };

    const second = await supabase.rpc("grant_teacher_access", { p_instructor_id: instructorId });
    if (second.error) return { ok: false, message: "Invite sent, but linking failed. Try again." };
    outcome = second.data;
  }

  if (outcome !== "linked") {
    return { ok: false, message: MESSAGES[outcome ?? ""] ?? "Could not give access." };
  }

  revalidatePath("/instructors");
  return { ok: true };
}

export async function revokeTeacherAccess(instructorId: string): Promise<DialogResult> {
  const ctx = await requireSchool();
  if (!ADMIN_ROLES.includes(ctx.role)) return { ok: false, message: NOT_ALLOWED };

  const supabase = await createClient();
  const { error } = await supabase.rpc("revoke_teacher_access", { p_instructor_id: instructorId });
  if (error) return { ok: false, message: "Could not remove access. Try again." };

  revalidatePath("/instructors");
  return { ok: true };
}
