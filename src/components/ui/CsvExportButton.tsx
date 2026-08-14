"use client";

import { Chip } from "@/components/ui/Chip";
import { toCsv, downloadCsv, type CsvColumn } from "@/lib/csv";

export function CsvExportButton<T>({
  rows,
  columns,
  filename,
}: {
  rows: T[];
  columns: CsvColumn<T>[];
  filename: string;
}) {
  return (
    <Chip
      onClick={() => downloadCsv(filename, toCsv(rows, columns))}
      disabled={rows.length === 0}
    >
      Export CSV
    </Chip>
  );
}
