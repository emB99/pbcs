import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/auth";
import { Card, CardHead } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LogOut } from "lucide-react";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-xl font-semibold">Settings</h1>

      <Card>
        <CardHead title="Account" note={user?.email ?? undefined} />
        <div className="flex flex-col gap-3 px-5 pb-5">
          <p className="text-[13px] text-ink-mid">
            To change your password, sign out and use &ldquo;Forgot your password?&rdquo;
            on the sign-in screen.
          </p>
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
