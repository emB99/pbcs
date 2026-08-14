import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Rail } from "@/components/rail/Rail";
import { Topbar } from "@/components/rail/Topbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const displayName =
    (user.user_metadata?.full_name as string | undefined) ??
    user.email?.split("@")[0] ??
    "there";

  return (
    <div className="flex min-h-full items-start gap-[18px] bg-canvas p-[22px] max-[680px]:flex-col max-[680px]:p-3.5">
      <Rail />
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <Topbar userId={user.id} displayName={displayName} />
        {children}
      </div>
    </div>
  );
}
