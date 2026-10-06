import { Rail } from "@/components/rail/Rail";
import { Topbar } from "@/components/rail/Topbar";
import { SchoolProvider } from "@/components/school/SchoolProvider";
import { logoUrl } from "@/lib/brand";
import type { SchoolContext } from "@/lib/school";

/** The rail + topbar frame shared by the office area and the teacher portal. */
export function AppShell({ ctx, children }: { ctx: SchoolContext; children: React.ReactNode }) {
  return (
    <SchoolProvider
      value={{
        terms: ctx.terms,
        role: ctx.role,
        schoolName: ctx.settings.name,
        schoolType: ctx.settings.school_type,
        logoUrl: logoUrl(ctx.settings.logo_path),
        region: {
          currency: ctx.settings.base_currency,
          locale: ctx.settings.locale,
          timezone: ctx.settings.timezone,
        },
        acceptedCurrencies: ctx.settings.accepted_currencies,
        paymentMethods: ctx.settings.payment_methods,
      }}
    >
      <div className="flex min-h-full items-start gap-[18px] bg-canvas p-[22px] max-[680px]:flex-col max-[680px]:p-3.5">
        <Rail />
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <Topbar
            userId={ctx.userId}
            displayName={ctx.displayName}
            email={ctx.email}
            showSearch={ctx.role !== "teacher"}
          />
          {children}
        </div>
      </div>
    </SchoolProvider>
  );
}
