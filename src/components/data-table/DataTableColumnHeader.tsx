import type { HTMLAttributes } from "react";
import type { Column } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DataTableColumnHeaderProps<TData, TValue> extends HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
}

/**
 * Cabeçalho de coluna ordenável para uso em `ColumnDef.header`.
 * Colunas sem `enableSorting` renderizam apenas o título estático.
 *
 * O `aria-sort` fica no elemento <th> (TableHead), aplicado pelo próprio
 * DataTable ao montar a linha de cabeçalho — este componente só cuida do
 * botão/ícone clicável.
 */
export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
  ...props
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return (
      <div className={cn("text-sm font-medium", className)} {...props}>
        {title}
      </div>
    );
  }

  const sorted = column.getIsSorted();

  return (
    <div className={cn("flex items-center", className)} {...props}>
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8 gap-1.5 px-2 data-[state=open]:bg-accent"
        onClick={() => column.toggleSorting(sorted === "asc")}
        aria-label={`Ordenar por ${title}${
          sorted === "asc" ? ", ordem ascendente" : sorted === "desc" ? ", ordem descendente" : ""
        }`}
      >
        <span>{title}</span>
        {sorted === "desc" ? (
          <ArrowDown className="h-3.5 w-3.5" />
        ) : sorted === "asc" ? (
          <ArrowUp className="h-3.5 w-3.5" />
        ) : (
          <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </Button>
    </div>
  );
}
