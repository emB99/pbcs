import Link from "next/link";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { signOut } from "@/lib/actions/auth";
import { ADMIN_ROLES, requireSchool } from "@/lib/school";
import { Card, CardHead } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";
import { SchoolSettingsForm } from "@/components/settings/SchoolSettingsForm";
import { TeamPanel, type TeamMember } from "@/components/settings/TeamPanel";
import { TermsPanel } from "@/components/settings/TermsPanel";
import { cn } from "@/lib/cn";
import type { Term } from "@/lib/types";

type Tab = "account" | "school" | "terms" | "team";

export default async function SettingsPage(props: PageProps<"/settings">) {
  const ctx = await requireSchool();
  const isAdmin = ADMIN_ROLES.includes(ctx.role);

  const { tab: rawTab } = await props.searchParams;
  const requested = Array.isArray(rawTab) ? rawTab[0] : rawTab;
  const tab: Tab = isAdmin && (requested === "school" || requested === "terms" || requested === "team") ? requested : "account";

  const tabs: { key: Tab; label: string }[] = [
    { key: "account", label: "Account" },
    ...(isAdmin
      ? [
          { key: "school" as const, label: "School" },
          { key: "terms" as const, label: ctx.terms.term.many },
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
                ? "border-crust text-crust-deep"
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

      {tab === "terms" && (
        <Card>
          <CardHead
            title={ctx.terms.term.many}
            note={`The academic calendar: ${ctx.terms.term.many.toLowerCase()} and when results close`}
          />
          <TermsPanel terms={await loadTerms()} />
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

async function AccountTab() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const displayName = (user?.user_metadata?.full_name as string | undefined) ?? "";
  const provider = (user?.app_metadata?.provider as string | undefined) ?? "email";

  return (
    <>
      <Card>
        <CardHead title="Profile" note={user?.email ?? undefined}>
          <Tag variant="ok">{provider === "google" ? "Google" : "Email"}</Tag>
        </CardHead>
        <div className="px-6 pb-6">
          <ProfileForm defaultFullName={displayName} />
        </div>
      </Card>

      <Card>
        <CardHead title="Password" note="Change the password used to sign in" />
        <div className="px-6 pb-6">
          <ChangePasswordForm />
        </div>
      </Card>

      <Card>
        <CardHead title="Sign out" note="End your session on this device" />
        <div className="px-6 pb-6">
          <form action={signOut}>
            <Button type="submit" icon={<LogOut />}>
              Sign out
            </Button>
          </form>
        </div>
      </Card>
    </>
  );
}
