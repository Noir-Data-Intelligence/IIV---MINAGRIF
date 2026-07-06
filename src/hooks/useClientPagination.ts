import { useEffect, useMemo } from "react";
import { usePagination, type PageSize } from "./usePagination";

/**
 * Paginação client-side para listas já carregadas em memória.
 * Mantém a mesma API de `usePagination` + devolve o slice da página actual
 * em `pageItems`. Útil para uniformizar a UI de paginação em listas pequenas.
 */
export function useClientPagination<T>(items: T[], initialPageSize: PageSize = 20) {
  const pag = usePagination(initialPageSize);

  useEffect(() => {
    pag.setTotal(items.length);
    // se a página actual ficou vazia (ex.: depois de um filtro), recua
    const maxPage = Math.max(0, Math.ceil(items.length / pag.pageSize) - 1);
    if (pag.page > maxPage) pag.setPage(maxPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length, pag.pageSize]);

  const pageItems = useMemo(
    () => items.slice(pag.from, pag.to + 1),
    [items, pag.from, pag.to],
  );

  return { ...pag, pageItems };
}
