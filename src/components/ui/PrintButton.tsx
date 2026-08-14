"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function PrintButton({ label = "Print" }: { label?: string }) {
  return (
    <Button icon={<Printer />} onClick={() => window.print()}>
      {label}
    </Button>
  );
}
