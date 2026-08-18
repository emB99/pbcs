import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { inputClass } from "@/components/ui/FieldGroup";

/** A pill input with a leading icon, per the reference form-field pattern. */
export function IconField({
  icon,
  className,
  ...props
}: { icon: ReactNode } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink-soft [&>svg]:h-4 [&>svg]:w-4">
        {icon}
      </span>
      <input {...props} className={cn(inputClass, "pl-[38px]", className)} />
    </div>
  );
}
