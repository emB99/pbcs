"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { ADMIN_ROLES, NOT_ALLOWED, requireSchool } from "@/lib/school";
import { changeRoleSchema, inviteSchema } from "@/lib/validation/team";
import type { AppRole, DialogResult } from "@/lib/types";

function siteOrigin() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

/** Only an owner may grant or remove the owner role; admins manage everyone else. */
function canManage(actor: AppRole, target: AppRole) {
  if (!ADMIN_ROLES.includes(actor)) return false;
  return target !== "owner" || actor === "owner";
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

export async function changeMemberRole(userId: string, role: string): Promise<DialogResult> {
  const ctx = await requireSchool();
  const parsed = changeRoleSchema.safeParse({ role });
  if (!parsed.success) return { ok: false, message: "Choose a role." };

  const admin = createAdminClient();
  const { data: target } = await admin
    .from("memberships")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();
  if (!target) return { ok: false, message: "That person isn't on the team." };
  if (!canManage(ctx.role, target.role) || !canManage(ctx.role, parsed.data.role)) {
    return { ok: false, message: NOT_ALLOWED };
  }
  if (target.role === "owner" && parsed.data.role !== "owner") {
    const { count } = await admin
      .from("memberships")
      .select("user_id", { count: "exact", head: true })
      .eq("role", "owner");
    if ((count ?? 0) <= 1) return { ok: false, message: "A school needs at least one owner." };
  }

  const { error } = await admin.from("memberships").update({ role: parsed.data.role }).eq("user_id", userId);
  if (error) return { ok: false, message: "Couldn't change the role. Try again." };

  revalidatePath("/settings");
  return { ok: true };
}

export async function removeMember(userId: string): Promise<DialogResult> {
  const ctx = await requireSchool();
  if (userId === ctx.userId) return { ok: false, message: "You can't remove yourself." };

  const admin = createAdminClient();
  const { data: target } = await admin
    .from("memberships")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();
  if (!target) return { ok: true };
  if (!canManage(ctx.role, target.role)) return { ok: false, message: NOT_ALLOWED };

  const { error } = await admin.from("memberships").delete().eq("user_id", userId);
  if (error) return { ok: false, message: "Couldn't remove them. Try again." };

  revalidatePath("/settings");
  return { ok: true };
}
