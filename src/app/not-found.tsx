import Link from "next/link";
import { GraduationCap } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 bg-canvas px-4 py-16 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-[13px] bg-brand shadow-brand">
        <GraduationCap className="h-6 w-6 text-on-brand" strokeWidth={1.8} />
      </div>
      <div>
        <h1 className="font-display text-xl font-semibold">We can&apos;t find that page</h1>
        <p className="mt-1 text-[13px] text-ink-soft">
          It may have been archived, or the link might be out of date.
        </p>
      </div>
      <Link
        href="/dashboard"
        className="rounded-md border border-brand bg-brand px-4 py-2.5 text-[13.5px] font-semibold text-on-brand shadow-brand"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
