import { AccountTab } from "@/components/settings/AccountTab";

export default function TeacherAccountPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-xl font-semibold">Account</h1>
      <AccountTab />
    </div>
  );
}
