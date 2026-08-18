import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/auth";
import { Card, CardHead } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { ChangePasswordForm } from "@/components/settings/ChangePasswordForm";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const displayName = (user?.user_metadata?.full_name as string | undefined) ?? "";
  const provider = (user?.app_metadata?.provider as string | undefined) ?? "email";

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-xl font-semibold">Account settings</h1>

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
    </div>
  );
}
