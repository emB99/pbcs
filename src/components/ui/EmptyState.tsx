import type { ReactNode } from "react";

export function EmptyState({
  icon,
  message,
  action,
}: {
  icon?: ReactNode;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      {icon && (
        <span className="text-ink-soft [&>svg]:h-8 [&>svg]:w-8 [&>svg]:stroke-[1.5]">
          {icon}
        </span>
      )}
      <p className="text-[13.5px] text-ink-soft">{message}</p>
      {action}
    </div>
  );
}
