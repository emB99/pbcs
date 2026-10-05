import { OFFICE_ROLES, requireRole } from "@/lib/school";

export default async function PrintLayout({ children }: { children: React.ReactNode }) {
  // Office roles only; signed-out visitors go to /login, teachers to their portal.
  await requireRole(...OFFICE_ROLES);

  return (
    <div className="min-h-full bg-canvas px-4 py-8 print:bg-white print:p-0">
      <div className="mx-auto max-w-[720px]">{children}</div>
    </div>
  );
}
