import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Google redirects the browser here (via Supabase's own /auth/v1/callback
 * hop) with a `code` param. Exchange it for a session, then send the user
 * on to the app.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
