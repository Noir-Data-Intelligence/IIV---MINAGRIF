import { PAGE_SIZE_OPTIONS, type PageSize } from "@/hooks/usePagination";
import { TablePagination } from "@/components/admin/TablePagination";

interface DataTablePaginationProps {
  pageIndex: number;
  pageSize: number;
  pageCount: number;
  /**
   * Total de registos no servidor, para a legenda "X–Y de Z" do
   * `TablePagination`. Quando o consumidor não o fornece (API ainda sem
   * contagem total), é estimado como `pageCount * pageSize` — impreciso se a
   * última página não estiver completa, mas suficiente para não bloquear a
   * integração.
   */
  rowCount?: number;
  onPageChange: (pageIndex: number) => void;
  onPageSizeChange: (pageSize: PageSize) => void;
}

/**
 * Adapta a API de paginação do TanStack Table (0-indexed, igual à do
 * `usePagination` existente) ao componente `TablePagination` já usado nas
 * páginas admin, em vez de reinventar a UI de paginação.
 */
export function DataTablePagination({
  pageIndex,
  pageSize,
  pageCount,
  rowCount,
  onPageChange,
  onPageSizeChange,
}: DataTablePaginationProps) {
  const totalPages = Math.max(1, pageCount);
  const total = rowCount ?? totalPages * pageSize;
  const safePageSize = (PAGE_SIZE_OPTIONS as readonly number[]).includes(pageSize)
    ? (pageSize as PageSize)
    : PAGE_SIZE_OPTIONS[0];

  return (
    <TablePagination
      page={pageIndex}
      pageSize={safePageSize}
      total={total}
      totalPages={totalPages}
      canPrev={pageIndex > 0}
      canNext={pageIndex < totalPages - 1}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
    />
  );
}
