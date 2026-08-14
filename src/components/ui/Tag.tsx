import { cn } from "@/lib/cn";

const VARIANTS = {
  late: "bg-[#F6E3DF] text-danger",
  due: "bg-butter text-butter-ink",
  ok: "bg-sage text-sage-ink",
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
