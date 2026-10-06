import { cn } from "@/lib/cn";

const VARIANTS = {
  late: "bg-danger-tint text-danger",
  due: "bg-warning text-warning-ink",
  ok: "bg-success text-success-ink",
} as const;

export function Tag({
  variant,
  children,
}: {
  variant: keyof typeof VARIANTS;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-block rounded-full px-[9px] py-1 text-[11px] font-semibold whitespace-nowrap",
        VARIANTS[variant],
      )}
    >
      {children}
    </span>
  );
}
