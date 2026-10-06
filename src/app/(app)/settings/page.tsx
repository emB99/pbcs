import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ADMIN_ROLES, requireSchool } from "@/lib/school";
import { Card, CardHead } from "@/components/ui/Card";
import { SchoolSettingsForm } from "@/components/settings/SchoolSettingsForm";
import { AccountTab } from "@/components/settings/AccountTab";
import { TeamPanel, type TeamMember } from "@/components/settings/TeamPanel";
import { TermsPanel } from "@/components/settings/TermsPanel";
import { GradeScalePanel } from "@/components/settings/GradeScalePanel";
import { BrandingForm } from "@/components/settings/BrandingForm";
import { LogoUploader } from "@/components/settings/LogoUploader";
import { RegionForm } from "@/components/settings/RegionForm";
import { RemindersForm } from "@/components/settings/RemindersForm";
import { emailMode } from "@/lib/email/send";
import { logoUrl, THEME_IDS, type ColorMode, type ThemeId } from "@/lib/brand";
import { cn } from "@/lib/cn";
import type { GradeBand, Term } from "@/lib/types";

type Tab = "account" | "school" | "branding" | "region" | "terms" | "grading" | "reminders" | "team";

export default async function SettingsPage(props: PageProps<"/settings">) {
  const ctx = await requireSchool();
  const isAdmin = ADMIN_ROLES.includes(ctx.role);

  const { tab: rawTab } = await props.searchParams;
  const requested = Array.isArray(rawTab) ? rawTab[0] : rawTab;
  const tab: Tab = isAdmin && (requested === "school" || requested === "branding" || requested === "region" || requested === "terms" || requested === "grading" || requested === "reminders" || requested === "team") ? requested : "account";

  const tabs: { key: Tab; label: string }[] = [
    { key: "account", label: "Account" },
    ...(isAdmin
      ? [
          { key: "school" as const, label: "School" },
          { key: "branding" as const, label: "Branding" },
          { key: "region" as const, label: "Region & money" },
          { key: "terms" as const, label: ctx.terms.term.many },
          { key: "grading" as const, label: "Grading" },
          { key: "reminders" as const, label: "Reminders" },
          { key: "team" as const, label: "Team" },
        ]
      : []),
  ];

  const teamMembers = tab === "team" ? await loadTeamSafely() : null;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-xl font-semibold">Settings</h1>

      <nav className="flex gap-1 border-b border-line-soft" aria-label="Settings sections">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={t.key === "account" ? "/settings" : `/settings?tab=${t.key}`}
            className={cn(
              "-mb-px border-b-2 px-3 py-2.5 text-[13px] font-semibold transition-colors",
              tab === t.key
                ? "border-brand text-brand-deep"
                : "border-transparent text-ink-soft hover:text-ink-mid",
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {tab === "account" && <AccountTab />}

      {tab === "school" && (
        <Card>
          <CardHead title="School" note="Name, type of school, contact details and wording" />
          <div className="px-6 pb-6">
            <SchoolSettingsForm settings={ctx.settings} />
          </div>
        </Card>
      )}

      {tab === "branding" && (
        <Card>
          <CardHead title="Branding" note="Your logo, colours and appearance" />
          <div className="flex flex-col gap-8 px-6 pb-6">
            <LogoUploader logoUrl={logoUrl(ctx.settings.logo_path)} />
            <BrandingForm
              saved={{
                theme: THEME_IDS.includes(ctx.settings.theme as ThemeId) ? (ctx.settings.theme as ThemeId) : "neutral",
                brandColor: ctx.settings.brand_color,
                colorMode: (["light", "dark", "system"].includes(ctx.settings.color_mode)
                  ? ctx.settings.color_mode
                  : "light") as ColorMode,
              }}
            />
          </div>
        </Card>
      )}

      {tab === "region" && (
        <Card>
          <CardHead title="Region & money" note="Currency, number and date format, timezone and payment methods" />
          <div className="px-6 pb-6">
            <RegionForm
              settings={{
                baseCurrency: ctx.settings.base_currency,
                acceptedCurrencies: ctx.settings.accepted_currencies,
                locale: ctx.settings.locale,
                timezone: ctx.settings.timezone,
                paymentMethods: ctx.settings.payment_methods,
              }}
              timezones={listTimezones()}
              baseLocked={await hasTransactions()}
            />
          </div>
        </Card>
      )}

      {tab === "terms" && (
        <Card>
          <CardHead
            title={ctx.terms.term.many}
            note={`The academic calendar: ${ctx.terms.term.many.toLowerCase()} and when results close`}
          />
          <TermsPanel terms={await loadTerms()} />
        </Card>
      )}

      {tab === "grading" && (
        <Card>
          <CardHead title="Grading" note="How marks turn into grades" />
          <GradeScalePanel bands={await loadBands()} />
        </Card>
      )}

      {tab === "reminders" && (
        <Card>
          <CardHead title="Reminders" note="Email students and guardians about money owed" />
          <RemindersForm
            settings={{
              enabled: ctx.settings.reminders_enabled,
              daysBefore: ctx.settings.reminder_days_before,
              repeatDays: ctx.settings.reminder_repeat_days,
            }}
            mode={emailMode()}
            scheduled={Boolean(process.env.CRON_SECRET && process.env.SUPABASE_SERVICE_ROLE_KEY)}
          />
        </Card>
      )}

      {tab === "team" && (
        <Card>
          <CardHead title="Team" note="Who can sign in, and what they can do" />
          {teamMembers ? (
            <TeamPanel members={teamMembers} currentUserId={ctx.userId} currentRole={ctx.role} />
          ) : (
            <p className="px-6 pb-6 text-[13px] text-danger">
              The team list needs SUPABASE_SERVICE_ROLE_KEY in .env.local. Add it and restart the dev server.
            </p>
          )}
        </Card>
      )}
    </div>
  );
}

/** IANA timezones, listed on the server so the browser and server agree on the options. */
function listTimezones(): string[] {
  try {
    return Intl.supportedValuesOf("timeZone");
  } catch {
    return ["Africa/Harare", "Africa/Johannesburg", "Africa/Nairobi", "Europe/London", "UTC"];
  }
}

/** The base currency is locked once the ledger has anything in it. */
async function hasTransactions(): Promise<boolean> {
  const supabase = await createClient();
  const { count } = await supabase.from("transactions").select("id", { count: "exact", head: true });
  return (count ?? 0) > 0;
}

async function loadBands(): Promise<GradeBand[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("grade_scale_bands")
    .select("*")
    .order("min_mark", { ascending: false })
    .returns<GradeBand[]>();
  return data ?? [];
}

async function loadTerms(): Promise<Term[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("terms")
    .select("*")
    .order("start_date", { ascending: false })
    .returns<Term[]>();
  return data ?? [];
}

/** Null when the service-role key is not configured (or the lookup fails). */
async function loadTeamSafely(): Promise<TeamMember[] | null> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  try {
    return await loadTeam();
  } catch {
    return null;
  }
}

async function loadTeam(): Promise<TeamMember[]> {
  const admin = createAdminClient();
  const [{ data: memberships }, { data: usersPage }] = await Promise.all([
    admin.from("memberships").select("user_id, role, created_at").order("created_at"),
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);
  const usersById = new Map((usersPage?.users ?? []).map((u) => [u.id, u]));
  return (memberships ?? []).map((m) => {
    const u = usersById.get(m.user_id);
    const email = u?.email ?? null;
    return {
      user_id: m.user_id,
      role: m.role,
      email,
      name: (u?.user_metadata?.full_name as string | undefined) ?? email?.split("@")[0] ?? "Unknown",
    };
  });
}
