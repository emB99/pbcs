import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PRODUCT_NAME } from "@/lib/brand";
import { resolveTerms, type TerminologyOverrides, type Terms } from "@/lib/terminology";
import type { AppRole, SchoolSettings } from "@/lib/types";

export const OFFICE_ROLES: AppRole[] = ["owner", "admin", "staff"];
export const ADMIN_ROLES: AppRole[] = ["owner", "admin"];

export type SchoolContext = {
  userId: string;
  email: string | undefined;
  displayName: string;
  role: AppRole;
  settings: SchoolSettings;
  terms: Terms;
};

export type SessionState =
  | { status: "signed_out" }
  | { status: "needs_setup"; userId: string; email: string | undefined }
  | { status: "no_access"; userId: string; email: string | undefined }
  | { status: "ok"; context: SchoolContext };

/**
 * Resolves who the caller is and which school they belong to. Cached per
 * request so layouts, pages and actions can all call it freely.
 */
export const getSessionState = cache(async (): Promise<SessionState> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "signed_out" };

  const [{ data: settings }, { data: membership }] = await Promise.all([
    supabase.from("school_settings").select("*").maybeSingle(),
    supabase.from("memberships").select("role").eq("user_id", user.id).maybeSingle(),
  ]);

  // RLS hides school_settings from non-members, so "no settings row" is
  // ambiguous: either the school hasn't been set up yet, or this user isn't
  // a member. Only a member can see the row, so distinguish via the role.
  if (!membership) {
    const { count } = await createAdminClient()
      .from("school_settings")
      .select("id", { count: "exact", head: true });
    return count && count > 0
      ? { status: "no_access", userId: user.id, email: user.email }
      : { status: "needs_setup", userId: user.id, email: user.email };
  }
  if (!settings) return { status: "no_access", userId: user.id, email: user.email };

  const displayName =
    (user.user_metadata?.full_name as string | undefined) ??
    user.email?.split("@")[0] ??
    "there";

  return {
    status: "ok",
    context: {
      userId: user.id,
      email: user.email,
      displayName,
      role: membership.role,
      settings,
      terms: resolveTerms(
        settings.school_type,
        settings.terminology as TerminologyOverrides | null,
      ),
    },
  };
});

/** For pages/layouts: redirect unless the caller is a member of the school. */
export async function requireSchool(): Promise<SchoolContext> {
  const state = await getSessionState();
  if (state.status === "signed_out") redirect("/login");
  if (state.status === "needs_setup") redirect("/setup");
  if (state.status === "no_access") redirect("/no-access");
  return state.context;
}

/**
 * For pages and server actions: like requireSchool, but also enforces the
 * role. Pages redirect teachers to their portal; actions should use
 * assertRole, which throws instead of redirecting.
 */
export async function requireRole(...roles: AppRole[]): Promise<SchoolContext> {
  const ctx = await requireSchool();
  if (!roles.includes(ctx.role)) {
    redirect(ctx.role === "teacher" ? "/teach" : "/dashboard");
  }
  return ctx;
}

/** For server actions that return DialogResult/FormState rather than redirect. */
export async function hasRole(...roles: AppRole[]): Promise<boolean> {
  const state = await getSessionState();
  return state.status === "ok" && roles.includes(state.context.role);
}

export const NOT_ALLOWED = "You don't have permission to do that.";

/**
 * Name shown on pages anyone can see (login, setup). Reads with the service
 * role because RLS hides school_settings from signed-out visitors; only the
 * name leaves this function.
 */
export const getPublicSchoolName = cache(async (): Promise<string> => {
  // Reads live data, so opt out of static prerendering.
  await connection();
  try {
    const { data } = await createAdminClient().from("school_settings").select("name").maybeSingle();
    return data?.name ?? PRODUCT_NAME;
  } catch {
    // Missing service key or DB hiccup: the login page should still render.
    return PRODUCT_NAME;
  }
});
