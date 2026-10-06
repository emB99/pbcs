import { toInitials, tintForId, type AvatarTint } from "@/lib/initials";
import { cn } from "@/lib/cn";

const TINT_CLASSES: Record<AvatarTint, string> = {
  a: "bg-warning text-warning-ink",
  b: "bg-success text-success-ink",
  c: "bg-info text-info-ink",
  d: "bg-danger-tint text-danger-ink",
  e: "bg-brand-tint text-brand-deep",
};

export function AvatarInitials({
  id,
  name,
  size = "md",
  round = false,
  src,
}: {
  id: string;
  name: string;
  size?: "sm" | "md" | "lg";
  /** Circular (topbar "who am I" style) instead of the default rounded square. */
  round?: boolean;
  /** Signed photo URL; falls back to initials when absent. */
  src?: string | null;
}) {
  const tint = tintForId(id);
  const dims =
    size === "sm" ? "h-[30px] w-[30px] text-[10.5px]" : size === "lg" ? "h-11 w-11 text-sm" : "h-[34px] w-[34px] text-[11.5px]";

  return (
    <div
      className={cn(
        "grid flex-none place-items-center overflow-hidden font-bold tracking-[0.02em]",
        round ? "rounded-full" : "rounded-[11px]",
        dims,
        TINT_CLASSES[tint],
      )}
      aria-hidden="true"
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL, not optimisable
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        toInitials(name)
      )}
    </div>
  );
}
