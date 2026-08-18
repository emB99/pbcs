import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "primary" | "danger";
  icon?: ReactNode;
  fullWidth?: boolean;
  /** Center icon+label instead of the default left-aligned row (quick-action lists want left; standalone form buttons want centered). */
  center?: boolean;
};

export function Button({
  variant = "default",
  icon,
  fullWidth,
  center,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "flex items-center gap-[11px] rounded-md border px-[15px] py-[13px] text-[13.5px] font-semibold transition-[transform,box-shadow] duration-[120ms]",
        "hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(31,27,22,0.07)]",
        "disabled:pointer-events-none disabled:opacity-60",
        fullWidth && "w-full",
        fullWidth && (center ? "justify-center text-center" : "text-left"),
        variant === "default" &&
          "border-line bg-surface text-ink",
        variant === "primary" &&
          "border-crust bg-crust text-white shadow-[0_3px_10px_rgba(184,101,26,0.26)] hover:shadow-[0_6px_16px_rgba(184,101,26,0.32)]",
        variant === "danger" &&
          "border-danger bg-danger text-white",
        className,
      )}
      {...props}
    >
      {icon && (
        <span className="[&>svg]:h-[17px] [&>svg]:w-[17px] [&>svg]:flex-none [&>svg]:stroke-[1.9]">
          {icon}
        </span>
      )}
      {children}
    </button>
  );
}
