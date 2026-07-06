import { QueryClient } from "@tanstack/react-query";

/**
 * QueryClient partilhado por toda a app.
 *
 * Instância única exportada (em vez de criada inline em App.tsx) para que
 * serviços, testes e utilitários possam invalidar/pré-carregar queries sem
 * depender do componente React.
 *
 * Escolhas para uma app admin (dados que mudam com moderação, muita navegação
 * entre listas e detalhes):
 *  - retry: 1        -> uma nova tentativa chega; não martelar o backend em falhas reais.
 *  - staleTime: 30s  -> evita refetch imediato ao navegar de volta a uma lista
 *                       acabada de ver; as mutações invalidam explicitamente na mesma.
 *  - refetchOnWindowFocus: false -> num painel de gestão, refetch a cada foco de
 *                       janela é ruído; preferimos invalidação explícita pós-mutação.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

export default queryClient;
