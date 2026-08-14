"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/cn";

export function SearchInput({
  value,
  onChange,
  placeholder,
  size = "default",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  size?: "default" | "mini";
}) {
  return (
    <label
      className={cn(
        "flex items-center gap-2 rounded-full border border-line bg-surface text-ink-soft",
        size === "mini"
          ? "min-w-[190px] gap-2 border-line-soft bg-surface-2 px-3.5 py-[7px] text-[12.5px]"
          : "w-[270px] px-4 py-[9px] text-[13px]",
      )}
    >
      <Search className={size === "mini" ? "h-3.5 w-3.5 flex-none" : "h-[15px] w-[15px] flex-none"} />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-ink outline-none placeholder:text-ink-soft"
      />
    </label>
  );
}
