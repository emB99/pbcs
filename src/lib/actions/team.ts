"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ADMIN_ROLES, NOT_ALLOWED, requireSchool } from "@/lib/school";
import { changeRoleSchema, inviteSchema } from "@/lib/validation/team";
import type { DialogResult } from "@/lib/types";

function siteOrigin() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

async function findUserIdByEmail(email: string): Promise<string | null> {
  const admin = createAdminClient();
  // Small schools: a single page of users is plenty.
  const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  return data?.users.find((u) => u.email?.toLowerCase() === email)?.id ?? null;
}

export async function inviteMember(input: { email: string; role: string }): Promise<DialogResult> {
  const ctx = await requireSchool();
  if (!ADMIN_ROLES.includes(ctx.role)) return { ok: false, message: NOT_ALLOWED };

  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check the details." };
  }

  const admin = createAdminClient();
  let userId = await findUserIdByEmail(parsed.data.email);
  if (!userId) {
    const { data, error } = await admin.auth.admin.inviteUserByEmail(parsed.data.email, {
      redirectTo: `${siteOrigin()}/reset-password`,
    });
    if (error || !data.user) return { ok: false, message: "Couldn't send the invite. Try again." };
    userId = data.user.id;
  }

  const { error } = await admin
    .from("memberships")
    .upsert({ user_id: userId, role: parsed.data.role }, { onConflict: "user_id", ignoreDuplicates: true });
  if (error) return { ok: false, message: "Couldn't add them to the school. Try again." };

  revalidatePath("/settings");
  return { ok: true };
}

/**
 * Gives a role to someone who has signed in but has none yet, or changes an existing
 * member's role. The database function enforces the owner rules.
 */
export async function changeMemberRole(userId: string, role: string): Promise<DialogResult> {
  const ctx = await requireSchool();
  if (!ADMIN_ROLES.includes(ctx.role)) return { ok: false, message: NOT_ALLOWED };
  const parsed = changeRoleSchema.safeParse({ role });
  if (!parsed.success) return { ok: false, message: "Choose a role." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_member_role", { p_user_id: userId, p_role: parsed.data.role });
  if (error) return { ok: false, message: roleError(error.message) };

  revalidatePath("/settings");
  return { ok: true };
}

export async function removeMember(userId: string): Promise<DialogResult> {
  const ctx = await requireSchool();
  if (!ADMIN_ROLES.includes(ctx.role)) return { ok: false, message: NOT_ALLOWED };

  const supabase = await createClient();
  const { error } = await supabase.rpc("remove_member", { p_user_id: userId });
  if (error) return { ok: false, message: roleError(error.message) };

  revalidatePath("/settings");
  return { ok: true };
}

function roleError(message: string): string {
  if (message.includes("at least one owner")) return "A school needs at least one owner.";
  if (message.includes("only an owner")) return "Only an owner can change owners.";
  if (message.includes("cannot remove yourself")) return "You can't remove yourself.";
  if (message.includes("not allowed")) return NOT_ALLOWED;
  return "Couldn't save that change. Try again.";
}
