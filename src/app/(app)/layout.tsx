import { requireSchool } from "@/lib/school";
import { Rail } from "@/components/rail/Rail";
import { Topbar } from "@/components/rail/Topbar";
import { SchoolProvider } from "@/components/school/SchoolProvider";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireSchool();

  return (
    <SchoolProvider
      value={{
        terms: ctx.terms,
        role: ctx.role,
        schoolName: ctx.settings.name,
        schoolType: ctx.settings.school_type,
      }}
    >
      <div className="flex min-h-full items-start gap-[18px] bg-canvas p-[22px] max-[680px]:flex-col max-[680px]:p-3.5">
        <Rail />
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <Topbar userId={ctx.userId} displayName={ctx.displayName} email={ctx.email} />
          {children}
        </div>
      </div>
    </SchoolProvider>
  );
}
