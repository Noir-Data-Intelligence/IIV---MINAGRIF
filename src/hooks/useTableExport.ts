import { useCallback } from "react";

type Row = Record<string, unknown>;

function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = typeof value === "object" ? JSON.stringify(value) : String(value);
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/**
 * Helper para exportar arrays de objectos para CSV.
 * Uso:
 *   const { exportCSV } = useTableExport();
 *   exportCSV(rows, "analises", { headers: { client_name: "Cliente" } });
 */
export function useTableExport() {
  const exportCSV = useCallback(
    (
      rows: Row[],
      filename = "export",
      options?: { headers?: Record<string, string>; columns?: string[] },
    ) => {
      if (!rows || rows.length === 0) return;
      const cols = options?.columns ?? Object.keys(rows[0]);
      const headerRow = cols.map((c) => escapeCSV(options?.headers?.[c] ?? c)).join(",");
      const body = rows.map((r) => cols.map((c) => escapeCSV(r[c])).join(",")).join("\n");
      const csv = "\uFEFF" + headerRow + "\n" + body; // BOM para Excel

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const stamp = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `${filename}-${stamp}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    [],
  );

  return { exportCSV };
}
