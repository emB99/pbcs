"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Users,
  BookOpen,
  CalendarDays,
  CreditCard,
  ChefHat,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/cn";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/students", label: "Students", icon: Users },
  { href: "/courses", label: "Courses", icon: BookOpen },
  { href: "/intakes", label: "Intakes", icon: CalendarDays },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/instructors", label: "Instructors", icon: ChefHat },
] as const;

export function Rail() {
  const pathname = usePathname();

  return (
    <aside className="no-print sticky top-[22px] flex w-[94px] flex-none flex-col items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 pt-5 pb-3.5 max-[680px]:static max-[680px]:w-full max-[680px]:flex-none max-[680px]:flex-row max-[680px]:gap-1 max-[680px]:overflow-x-auto max-[680px]:p-2.5">
      <div
        className="mb-[18px] grid h-11 w-11 flex-none place-items-center rounded-[13px] bg-crust shadow-[0_3px_10px_rgba(184,101,26,0.28)] max-[680px]:mb-0"
        aria-hidden="true"
      >
        <ChefHat className="h-[23px] w-[23px] text-white" strokeWidth={1.8} />
      </div>

      {NAV_ITEMS.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex w-full flex-col items-center gap-1.5 rounded-md px-1 pt-[11px] pb-[9px] text-center text-[10.5px] font-semibold tracking-[0.01em] text-ink-soft transition-colors",
              "hover:bg-surface-2 hover:text-ink-mid",
              "max-[680px]:w-auto max-[680px]:flex-none max-[680px]:px-3 max-[680px]:py-[9px]",
              isActive && "bg-crust-tint text-crust-deep",
            )}
          >
            <Icon className="h-5 w-5" strokeWidth={1.7} />
            {item.label}
          </Link>
        );
      })}

      <div className="min-h-3.5 flex-1 max-[680px]:hidden" />

      <Link
        href="/settings"
        className={cn(
          "flex w-full flex-col items-center gap-1.5 rounded-md px-1 pt-[11px] pb-[9px] text-center text-[10.5px] font-semibold tracking-[0.01em] text-ink-soft transition-colors",
          "hover:bg-surface-2 hover:text-ink-mid",
          "max-[680px]:w-auto max-[680px]:flex-none max-[680px]:px-3 max-[680px]:py-[9px]",
          pathname === "/settings" && "bg-crust-tint text-crust-deep",
        )}
      >
        <Settings className="h-5 w-5" strokeWidth={1.7} />
        Settings
      </Link>
    </aside>
  );
}
