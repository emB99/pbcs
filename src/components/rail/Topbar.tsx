import { Search } from "lucide-react";
import { AvatarInitials } from "@/components/ui/AvatarInitials";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function Topbar({
  userId,
  displayName,
}: {
  userId: string;
  displayName: string;
}) {
  const firstName = displayName.split(" ")[0] || displayName;

  return (
    <div className="no-print flex flex-wrap items-center gap-4 px-1 py-0.5">
      <div>
        <h1 className="font-display m-0 text-[25px] font-semibold tracking-[-0.01em]">
          {greeting()}, {firstName}
        </h1>
        <p className="mt-0.5 text-[12.5px] text-ink-soft">
          {dateFormatter.format(new Date())}
        </p>
      </div>
      <div className="min-w-5 flex-1" />
      <label className="flex w-[270px] items-center gap-2.5 rounded-full border border-line bg-surface px-4 py-[9px] text-[13px] text-ink-soft max-[680px]:order-3 max-[680px]:w-full">
        <Search className="h-[15px] w-[15px] flex-none" />
        <input
          type="search"
          placeholder="Find a student or receipt"
          className="w-full bg-transparent outline-none placeholder:text-ink-soft"
        />
      </label>
      <div className="flex items-center gap-2.5 rounded-full border border-line bg-surface py-[5px] pr-3.5 pl-[5px]">
        <AvatarInitials id={userId} name={displayName} size="lg" round />
        <div>
          <b className="block text-[12.5px] leading-[1.2] font-semibold">
            {displayName}
          </b>
          <span className="block text-[10.5px] text-ink-soft">Administrator</span>
        </div>
      </div>
    </div>
  );
}
