import { useState, type ReactNode } from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type OnChangeFn,
  type PaginationState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import type { PageSize } from "@/hooks/usePagination";
import { DataTableToolbar } from "./DataTableToolbar";
import { DataTablePagination } from "./DataTablePagination";

/**
 * Augmentation do `ColumnMeta` do TanStack Table para permitir um rótulo
 * amigável por coluna (usado no dropdown de mostrar/ocultar colunas). É
 * opcional — sem ele, `DataTableViewOptions` usa o `column.id`.
 */
declare module "@tanstack/react-table" {
  interface ColumnMeta<TData, TValue> {
    label?: string;
  }
}

const ACTIONS_COLUMN_ID = "__actions";

export interface DataTableProps<TData> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TValue varies per column; matches TanStack Table's own generic-component pattern.
  columns: ColumnDef<TData, any>[];
  data: TData[];
  loading?: boolean;
  emptyMessage?: string;
  /** Substitui o skeleton de carregamento por omissão. */
  renderLoading?: () => ReactNode;
  /** Acções por linha (ex.: `<RowActions .../>`), renderizadas numa última coluna injectada pelo DataTable. */
  renderRowActions?: (row: TData) => ReactNode;

  // --- Paginação server-side ---
  /** Nº total de páginas, calculado pelo consumidor a partir do total devolvido pela API. */
  pageCount: number;
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
  /** Total de registos, para a legenda da paginação. Ver `DataTablePagination`. */
  rowCount?: number;

  // --- Sorting ---
  /**
   * Escolha de design: por omissão o sorting é client-side, via
   * `getSortedRowModel` do próprio TanStack Table — simples e útil já hoje,
   * uma vez que a API Laravel ainda não expõe ordenação no servidor.
   * Quando existir, passa `manualSorting` e controla `sorting`/`onSortingChange`
   * a partir do consumidor (ex.: reflectindo num query param da API).
   */
  manualSorting?: boolean;
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;

  // --- Pesquisa global (controlada externamente) ---
  globalFilter?: string;
  onGlobalFilterChange?: (value: string) => void;
  searchPlaceholder?: string;

  /** Esconde a toolbar (pesquisa + colunas) por completo. */
  hideToolbar?: boolean;
}

/**
 * Tabela genérica headless (@tanstack/react-table) com apresentação em cima
 * do `<Table>` shadcn. Substitui o padrão actual de `<Table>` + `.map()`
 * manual nas páginas admin, acrescentando sorting, column-visibility e
 * paginação server-side reutilizando os componentes já existentes.
 */
export function DataTable<TData>({
  columns,
  data,
  loading = false,
  emptyMessage = "Sem dados para mostrar.",
  renderLoading,
  renderRowActions,
  pageCount,
  pagination,
  onPaginationChange,
  rowCount,
  manualSorting = false,
  sorting: controlledSorting,
  onSortingChange: controlledOnSortingChange,
  globalFilter,
  onGlobalFilterChange,
  searchPlaceholder,
  hideToolbar = false,
}: DataTableProps<TData>) {
  // Column-visibility: estado interno, exposto via DataTableViewOptions (na toolbar).
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  // Sorting: estado interno por omissão (client-side); se o consumidor
  // controlar `sorting`/`onSortingChange`, esse controlo tem prioridade
  // (necessário quando `manualSorting` for true, para reflectir a ordenação
  // do servidor).
  const [internalSorting, setInternalSorting] = useState<SortingState>([]);
  const sorting = controlledSorting ?? internalSorting;
  const onSortingChange = controlledOnSortingChange ?? setInternalSorting;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TValue varies per column; matches TanStack Table's own generic-component pattern.
  const tableColumns: ColumnDef<TData, any>[] = renderRowActions
    ? [
        ...columns,
        {
          id: ACTIONS_COLUMN_ID,
          header: "",
          enableHiding: false,
          enableSorting: false,
          cell: ({ row }) => renderRowActions(row.original),
        },
      ]
    : columns;

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: {
      sorting,
      columnVisibility,
      pagination,
    },
    pageCount,
    manualPagination: true,
    manualSorting,
    onPaginationChange,
    onSortingChange,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    // Sem manualSorting, ordena localmente sobre os dados da página actual.
    getSortedRowModel: manualSorting ? undefined : getSortedRowModel(),
  });

  const columnCount = tableColumns.length;

  return (
    <div className="w-full">
      {!hideToolbar && (
        <DataTableToolbar
          table={table}
          globalFilter={globalFilter}
          onGlobalFilterChange={onGlobalFilterChange}
          searchPlaceholder={searchPlaceholder}
        />
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  const ariaSort = !canSort
                    ? undefined
                    : sorted === "asc"
                      ? ("ascending" as const)
                      : sorted === "desc"
                        ? ("descending" as const)
                        : ("none" as const);

                  return (
                    <TableHead key={header.id} aria-sort={ariaSort}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {loading ? (
              renderLoading ? (
                renderLoading()
              ) : (
                <DataTableLoadingRows columnCount={columnCount} rowCount={Math.min(pagination.pageSize || 5, 10)} />
              )
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columnCount} className="h-24 text-center text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination
        pageIndex={pagination.pageIndex}
        pageSize={pagination.pageSize}
        pageCount={pageCount}
        rowCount={rowCount}
        onPageChange={(pageIndex) => onPaginationChange({ ...pagination, pageIndex })}
        onPageSizeChange={(pageSize: PageSize) => onPaginationChange({ pageIndex: 0, pageSize })}
      />
    </div>
  );
}

function DataTableLoadingRows({ columnCount, rowCount }: { columnCount: number; rowCount: number }) {
  return (
    <>
      {Array.from({ length: rowCount }).map((_, rowIndex) => (
        <TableRow key={`skeleton-row-${rowIndex}`}>
          {Array.from({ length: columnCount }).map((_, cellIndex) => (
            <TableCell key={`skeleton-cell-${rowIndex}-${cellIndex}`}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}
