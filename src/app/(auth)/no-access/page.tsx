import { redirect } from "next/navigation";
import { getSessionState } from "@/lib/school";
import { signOut } from "@/lib/actions/auth";
import { Button } from "@/components/ui/Button";

export default async function NoAccessPage() {
  const state = await getSessionState();
  if (state.status === "signed_out") redirect("/login");
  if (state.status === "needs_setup") redirect("/setup");
  if (state.status === "ok") redirect("/dashboard");

  return (
    <div className="flex flex-col gap-3 text-center">
      <h2 className="font-display text-xl font-semibold">No access yet</h2>
      <p className="text-[13px] text-ink-mid">
        {state.email ?? "This account"} isn&apos;t part of this school. Ask the school&apos;s
        administrator to invite you, then sign in again.
      </p>
      <form action={signOut}>
        <Button type="submit" fullWidth center>
          Sign out
        </Button>
      </form>
    </div>
  );
}
