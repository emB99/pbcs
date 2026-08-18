import type { SelectHTMLAttributes, ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { inputClass } from "@/components/ui/FieldGroup";

/** A pill select with a leading icon, matching IconField's input styling. */
export function IconSelect({
  icon,
  className,
  children,
  ...props
}: { icon: ReactNode; children: ReactNode } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink-soft [&>svg]:h-4 [&>svg]:w-4">
        {icon}
      </span>
      <select
        {...props}
        className={cn(inputClass, "appearance-none pr-9 pl-[38px]", className)}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 text-ink-soft" />
    </div>
  );
}
