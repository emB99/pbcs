import { ChefHat } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-[380px]">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-[13px] bg-crust shadow-[0_3px_10px_rgba(184,101,26,0.28)]">
            <ChefHat className="h-6 w-6 text-white" strokeWidth={1.8} />
          </div>
          <div>
            <h1 className="font-display text-lg font-semibold">PBCS</h1>
            <p className="text-xs text-ink-soft">Premium Baking and Culinary School</p>
          </div>
        </div>
        <div className="rounded-lg border border-line bg-surface p-6">{children}</div>
      </div>
    </div>
  );
}
