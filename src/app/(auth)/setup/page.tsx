import { redirect } from "next/navigation";
import { getSessionState } from "@/lib/school";
import { SetupForm } from "@/components/setup/SetupForm";

export default async function SetupPage() {
  const state = await getSessionState();
  if (state.status === "signed_out") redirect("/login");
  if (state.status === "ok") redirect("/dashboard");
  if (state.status === "no_access") redirect("/no-access");

  return <SetupForm email={state.email} />;
}
