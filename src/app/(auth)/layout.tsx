import { getPublicBrand } from "@/lib/school";
import { logoUrl } from "@/lib/brand";
import { SchoolLogo } from "@/components/school/SchoolLogo";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const brand = await getPublicBrand();

  return (
    <div className="flex min-h-full items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-[380px]">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <SchoolLogo logoUrl={logoUrl(brand.logoPath)} size="lg" />
          <h1 className="font-display text-lg font-semibold">{brand.name}</h1>
        </div>
        <div className="rounded-lg border border-line bg-surface p-6">{children}</div>
      </div>
    </div>
  );
}
