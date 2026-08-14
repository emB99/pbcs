import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Chip({
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "rounded-full border border-line bg-surface-2 px-3 py-[6px] text-[11.5px] font-semibold text-ink-mid",
        className,
      )}
      {...props}
    />
  );
}
