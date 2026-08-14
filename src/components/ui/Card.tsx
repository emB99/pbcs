import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-line bg-surface",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHead({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 px-5 pt-[17px] pb-[15px]">
      <div>
        <h2 className="m-0 text-[15.5px] font-[650] tracking-[-0.005em]">
          {title}
        </h2>
        {note && <p className="mt-0.5 text-xs text-ink-soft">{note}</p>}
      </div>
      <div className="min-w-3 flex-1" />
      {children}
    </div>
  );
}

export function CardFoot({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 border-t border-line-soft px-5 py-[13px] text-[12.5px] text-ink-soft">
      {children}
    </div>
  );
}
