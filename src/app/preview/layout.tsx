import { OFFICE_ROLES, requireRole } from "@/lib/school";

/**
 * Staff-only "preview as student" area — testing tool, not a real student
 * login. Deliberately outside the (app) route group so it renders without
 * the admin rail/topbar, closer to what a student view would actually look
 * like. Office roles only.
 */
export default async function PreviewLayout({ children }: { children: React.ReactNode }) {
  // Office roles only; signed-out visitors go to /login, teachers to their portal.
  await requireRole(...OFFICE_ROLES);

  return <div className="min-h-full bg-canvas">{children}</div>;
}
