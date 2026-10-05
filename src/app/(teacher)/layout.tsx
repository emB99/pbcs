import { redirect } from "next/navigation";
import { requireSchool } from "@/lib/school";
import { AppShell } from "@/components/rail/AppShell";

/** Teacher portal: teachers only. Office users have their own area. */
export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireSchool();
  if (ctx.role !== "teacher") redirect("/dashboard");

  return <AppShell ctx={ctx}>{children}</AppShell>;
}
