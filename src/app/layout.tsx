import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { getPublicBrand, getPublicSchoolName } from "@/lib/school";
import { onBrandColor } from "@/lib/brand";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["500", "600"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export async function generateMetadata(): Promise<Metadata> {
  const name = await getPublicSchoolName();
  return { title: name, description: `${name} — school administration` };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const brand = await getPublicBrand();
  // The school's own colour overrides the preset's default (validated as #rrggbb upstream).
  const brandStyle = brand.brandColor
    ? ({ "--brand": brand.brandColor, "--on-brand": onBrandColor(brand.brandColor) } as React.CSSProperties)
    : undefined;

  return (
    <html
      lang="en"
      data-theme={brand.theme}
      data-mode={brand.colorMode}
      style={brandStyle}
      className={`${fraunces.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
