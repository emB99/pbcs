import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PRODUCT_NAME, THEME_IDS, isHexColor, type ColorMode, type ThemeId } from "@/lib/brand";
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
    const { data: status } = await supabase.rpc("school_status");
    const setUp = (status as { set_up?: boolean } | null)?.set_up === true;
    return setUp
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

export type PublicBrand = {
  name: string;
  logoPath: string | null;
  theme: ThemeId;
  brandColor: string | null;
  colorMode: ColorMode;
};

const DEFAULT_BRAND: PublicBrand = {
  name: PRODUCT_NAME,
  logoPath: null,
  theme: "neutral",
  brandColor: null,
  colorMode: "light",
};

/**
 * What signed-out pages (login, setup) and the root layout need to look like
 * the school: name, logo, theme, brand colour, mode. Uses school_status(), a
 * security-definer function, because RLS hides school_settings from visitors;
 * only presentation fields leave it. Values are validated here, since they end
 * up in an inline style on <html>.
 */
export const getPublicBrand = cache(async (): Promise<PublicBrand> => {
  // Reads live data, so opt out of static prerendering.
  await connection();
  try {
    const supabase = await createClient();
    const { data } = await supabase.rpc("school_status");
    const s = (data ?? {}) as Record<string, string | null | undefined>;
    return {
      name: s.name ?? PRODUCT_NAME,
      logoPath: typeof s.logo_path === "string" && /^[\w.-]+$/.test(s.logo_path) ? s.logo_path : null,
      theme: THEME_IDS.includes(s.theme as ThemeId) ? (s.theme as ThemeId) : "neutral",
      brandColor: s.brand_color && isHexColor(s.brand_color) ? s.brand_color : null,
      colorMode: s.color_mode === "dark" || s.color_mode === "system" ? s.color_mode : "light",
    };
  } catch {
    // A DB hiccup should not stop the login page rendering.
    return DEFAULT_BRAND;
  }
});

/** Name shown on pages anyone can see (login, setup). */
export async function getPublicSchoolName(): Promise<string> {
  return (await getPublicBrand()).name;
}

/** For actions that return FormState/DialogResult: the caller's context if they are office staff, else null. */
export async function getOfficeContext(): Promise<SchoolContext | null> {
  const state = await getSessionState();
  return state.status === "ok" && OFFICE_ROLES.includes(state.context.role) ? state.context : null;
}
