import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Landing point for emailed links (staff invites, password recovery). The
 * Supabase email templates must point here with the token hash:
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite
 * We verify the token server-side so the session cookie is set before the
 * user lands on the "choose a password" page.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      // Invited and recovering users both need to set a password first.
      const needsPassword = type === "invite" || type === "recovery";
      return NextResponse.redirect(`${origin}${needsPassword ? "/reset-password" : "/dashboard"}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=link`);
}
