import type { Table } from "@tanstack/react-table";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "./DataTableViewOptions";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  /** Controlado externamente — a filtragem real fica a cargo do consumidor/API. */
  globalFilter?: string;
  onGlobalFilterChange?: (value: string) => void;
  searchPlaceholder?: string;
}

/**
 * Barra de ferramentas: pesquisa global (input controlado) + botão de
 * mostrar/ocultar colunas. O input de pesquisa só aparece se o consumidor
 * fornecer `onGlobalFilterChange` — sem isso não há para onde a pesquisa ir.
 */
export function DataTableToolbar<TData>({
  table,
  globalFilter,
  onGlobalFilterChange,
  searchPlaceholder = "Pesquisar...",
}: DataTableToolbarProps<TData>) {
  return (
    <div className="flex items-center justify-between gap-2 pb-4">
      {onGlobalFilterChange ? (
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={globalFilter ?? ""}
            onChange={(event) => onGlobalFilterChange(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-9 pl-8"
          />
        </div>
      ) : (
        <div />
      )}
      <DataTableViewOptions table={table} />
    </div>
  );
}
