"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  loginSchema,
  forgotPasswordSchema,
  signUpSchema,
  updateProfileSchema,
  changePasswordSchema,
} from "@/lib/validation/auth";
import type { DialogResult } from "@/lib/types";

function siteOrigin() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export type AuthFormState = { error: string } | undefined;

export async function signIn(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your details and try again." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { error: "Email or password is incorrect." };
  }

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export type ForgotPasswordState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "sent" };

export async function requestPasswordReset(
  _prevState: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Enter a valid email address.",
    };
  }

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${siteOrigin()}/reset-password`,
  });

  // Always report success, whether or not the address has an account —
  // don't leak which emails exist.
  return { status: "sent" };
}

export type SignUpState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "sent" };

export async function signUp(
  _prevState: SignUpState,
  formData: FormData,
): Promise<SignUpState> {
  const parsed = signUpSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Check your details and try again.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${siteOrigin()}/dashboard`,
    },
  });

  if (error) {
    return {
      status: "error",
      message: error.message.toLowerCase().includes("already registered")
        ? "An account with that email already exists."
        : "Couldn't create the account. Try again.",
    };
  }

  // If email confirmation is off in the Supabase project, signUp returns an
  // active session immediately — go straight in instead of asking them to
  // check an email that was never sent.
  if (data.session) {
    redirect("/dashboard");
  }

  return { status: "sent" };
}

export type ProfileFormState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "saved" };

export async function updateProfile(
  _prevState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const parsed = updateProfileSchema.safeParse({ fullName: formData.get("fullName") });
  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Enter your name.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    data: { full_name: parsed.data.fullName },
  });
  if (error) {
    return { status: "error", message: "Couldn't save your name. Try again." };
  }

  revalidatePath("/", "layout");
  return { status: "saved" };
}

export async function changePassword(input: {
  password: string;
  confirmPassword: string;
}): Promise<DialogResult> {
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Check your password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return { ok: false, message: "Couldn't update your password. Try again." };
  }

  return { ok: true };
}

export async function signInWithGoogle() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${siteOrigin()}/auth/callback`,
    },
  });

  if (error || !data.url) {
    redirect("/login?error=google");
  }

  redirect(data.url);
}
