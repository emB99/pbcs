import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Staff-only "preview as student" area — testing tool, not a real student
 * login. Deliberately outside the (app) route group so it renders without
 * the admin rail/topbar, closer to what a student view would actually look
 * like. Access is the same as everywhere else in the app right now (any
 * authenticated user) since this is a preview of already-permitted data,
 * not a new access grant.
 */
export default async function PreviewLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <div className="min-h-full bg-canvas">{children}</div>;
}
