import { AvatarInitials } from "@/components/ui/AvatarInitials";

export function StudentBanner({
  id,
  name,
  phone,
  enrolmentCount,
  balance,
}: {
  id: string;
  name: string;
  phone: string;
  enrolmentCount: number;
  balance: number;
}) {
  return (
    <div className="relative overflow-hidden rounded-lg bg-ink px-6 py-7">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-14 -right-14 h-44 w-44 rounded-full border-[18px] border-crust/25"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-10 right-6 h-16 w-16 rounded-full border-[10px] border-sage/20"
      />
      <div className="relative flex items-center gap-4">
        <div className="rounded-full ring-2 ring-surface/30 ring-offset-2 ring-offset-ink">
          <AvatarInitials id={id} name={name} size="lg" round />
        </div>
        <div className="min-w-0">
          <h1 className="font-display truncate text-2xl font-semibold text-surface">{name}</h1>
          <p className="mt-1 text-[13px] text-surface/70">
            {phone} · {enrolmentCount} {enrolmentCount === 1 ? "enrolment" : "enrolments"} · $
            {balance.toFixed(2)} balance
          </p>
        </div>
      </div>
    </div>
  );
}
