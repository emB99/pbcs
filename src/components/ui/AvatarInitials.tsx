import { toInitials, tintForId, type AvatarTint } from "@/lib/initials";
import { cn } from "@/lib/cn";

const TINT_CLASSES: Record<AvatarTint, string> = {
  a: "bg-butter text-butter-ink",
  b: "bg-sage text-sage-ink",
  c: "bg-sky text-sky-ink",
  d: "bg-rose text-rose-ink",
  e: "bg-crust-tint text-crust-deep",
};

export function AvatarInitials({
  id,
  name,
  size = "md",
  round = false,
}: {
  id: string;
  name: string;
  size?: "sm" | "md" | "lg";
  /** Circular (topbar "who am I" style) instead of the default rounded square. */
  round?: boolean;
}) {
  const tint = tintForId(id);
  const dims =
    size === "sm" ? "h-[30px] w-[30px] text-[10.5px]" : size === "lg" ? "h-11 w-11 text-sm" : "h-[34px] w-[34px] text-[11.5px]";

  return (
    <div
      className={cn(
        "grid flex-none place-items-center font-bold tracking-[0.02em]",
        round ? "rounded-full" : "rounded-[11px]",
        dims,
        TINT_CLASSES[tint],
      )}
      aria-hidden="true"
    >
      {toInitials(name)}
    </div>
  );
}
