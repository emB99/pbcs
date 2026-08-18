"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Settings, LogOut, ChevronDown } from "lucide-react";
import { AvatarInitials } from "@/components/ui/AvatarInitials";
import { signOut } from "@/lib/actions/auth";

export function UserMenu({
  userId,
  displayName,
  email,
}: {
  userId: string;
  displayName: string;
  email?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2.5 rounded-full border border-line bg-surface py-[5px] pr-3 pl-[5px] shadow-[0_1px_2px_rgba(31,27,22,0.04)] transition-shadow hover:shadow-[0_2px_6px_rgba(31,27,22,0.08)]"
      >
        <AvatarInitials id={userId} name={displayName} size="lg" round />
        <div className="text-left">
          <b className="block text-[12.5px] leading-[1.2] font-semibold">{displayName}</b>
          <span className="block text-[10.5px] text-ink-soft">Administrator</span>
        </div>
        <ChevronDown className={`h-4 w-4 flex-none text-ink-soft transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute top-[calc(100%+8px)] right-0 z-10 w-56 overflow-hidden rounded-lg border border-line bg-surface shadow-[0_16px_32px_-12px_rgba(31,27,22,0.25)]"
        >
          <div className="border-b border-line-soft px-4 py-3">
            <p className="truncate text-[12.5px] font-semibold">{displayName}</p>
            {email && <p className="truncate text-[11.5px] text-ink-soft">{email}</p>}
          </div>
          <Link
            href="/settings"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-ink-mid hover:bg-surface-2"
          >
            <Settings className="h-4 w-4" />
            Account settings
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[13px] text-danger hover:bg-surface-2"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
