import { AvatarInitials } from "@/components/ui/AvatarInitials";
import { Tag } from "@/components/ui/Tag";
import type { StudentStatus } from "@/lib/types";

const STATUS_LABEL: Record<StudentStatus, string> = {
  active: "Active",
  graduated: "Graduated",
  withdrawn: "Withdrawn",
  suspended: "Suspended",
};

const STATUS_VARIANT = {
  active: "ok",
  graduated: "ok",
  suspended: "due",
  withdrawn: "late",
} as const;

export function StudentBanner({
  id,
  name,
  studentNumber,
  status,
  photoUrl,
  phone,
  enrolmentCount,
  balance,
}: {
  id: string;
  name: string;
  studentNumber: string;
  status: StudentStatus;
  photoUrl: string | null;
  phone: string | null;
  enrolmentCount: number;
  balance: number;
}) {
  const details = [
    phone,
    `${enrolmentCount} ${enrolmentCount === 1 ? "enrolment" : "enrolments"}`,
    `$${balance.toFixed(2)} balance`,
  ].filter(Boolean);

  return (
    <div className="relative overflow-hidden rounded-lg bg-ink px-6 py-7">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-14 -right-14 h-44 w-44 rounded-full border-[18px] border-brand/25"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-10 right-6 h-16 w-16 rounded-full border-[10px] border-success/20"
      />
      <div className="relative flex items-center gap-4">
        <div className="rounded-full ring-2 ring-surface/30 ring-offset-2 ring-offset-ink">
          <AvatarInitials id={id} name={name} size="lg" round src={photoUrl} />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display truncate text-2xl font-semibold text-surface">{name}</h1>
            <Tag variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Tag>
          </div>
          <p className="mt-1 text-[13px] text-surface/70">
            <span className="font-semibold text-surface/90">{studentNumber}</span>
            {" · "}
            {details.join(" · ")}
          </p>
        </div>
      </div>
    </div>
  );
}
