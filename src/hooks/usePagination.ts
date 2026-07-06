import { useState } from "react";

export const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;
export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

/**
 * Estado de paginação server-side. Página 0-indexed.
 * Use `from` e `to` directamente em `supabase.range(from, to)`.
 */
export function usePagination(initialPageSize: PageSize = 20) {
  const [pageSize, _setPageSize] = useState<PageSize>(initialPageSize);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  const setPageSize = (size: PageSize) => {
    _setPageSize(size);
    setPage(0); // reset ao mudar tamanho
  };

  const from = page * pageSize;
  const to = from + pageSize - 1;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    page,
    setPage,
    pageSize,
    setPageSize,
    total,
    setTotal,
    from,
    to,
    totalPages,
    canPrev: page > 0,
    canNext: page < totalPages - 1,
  };
}
