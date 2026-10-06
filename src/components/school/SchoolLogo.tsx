import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/cn";

const SIZES = {
  sm: { box: "h-9 w-9 rounded-[11px]", icon: "h-[18px] w-[18px]" },
  md: { box: "h-11 w-11 rounded-[13px]", icon: "h-[23px] w-[23px]" },
  lg: { box: "h-12 w-12 rounded-[13px]", icon: "h-6 w-6" },
  xl: { box: "h-16 w-16 rounded-[16px]", icon: "h-8 w-8" },
} as const;

/** The school's logo, or the brand-coloured graduation cap until one is uploaded. */
export function SchoolLogo({
  logoUrl,
  size = "md",
  className,
}: {
  logoUrl: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const s = SIZES[size];
  if (logoUrl) {
    return (
      <div
        className={cn("grid flex-none place-items-center overflow-hidden border border-line bg-surface", s.box, className)}
        aria-hidden="true"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- admin-uploaded, already size-limited */}
        <img src={logoUrl} alt="" className="h-full w-full object-contain p-1" />
      </div>
    );
  }
  return (
    <div className={cn("grid flex-none place-items-center bg-brand shadow-brand", s.box, className)} aria-hidden="true">
      <GraduationCap className={cn("text-on-brand", s.icon)} strokeWidth={1.8} />
    </div>
  );
}
