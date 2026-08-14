import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function PrintLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-full bg-canvas px-4 py-8 print:bg-white print:p-0">
      <div className="mx-auto max-w-[720px]">{children}</div>
    </div>
  );
}
