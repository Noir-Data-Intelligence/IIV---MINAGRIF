import axios, {
  AxiosError,
  AxiosHeaders,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";

/**
 * Cliente HTTP único da aplicação.
 *
 * É a base sobre a qual TODA a camada de dados (services/api/*) assenta.
 * Hoje as respostas são servidas pelo MSW (mock), amanhã (Fase 4) por um
 * backend Laravel REST. Nada nos componentes/hooks precisa de mudar: só
 * `VITE_API_URL` deixa de apontar para o mock e passa a apontar para o Laravel.
 */

/**
 * Forma normalizada de qualquer erro que saia deste cliente.
 *
 * Todo o resto da app (hooks react-query, formulários, toasts) depende deste
 * contrato — nunca do formato bruto do axios. `fieldErrors` mapeia o payload
 * de validação 422 do Laravel (`{ errors: { campo: [msg, ...] } }`) para um
 * dicionário simples `{ campo: primeiraMensagem }`, pronto a alimentar
 * mensagens de erro por campo nos formulários.
 */
export interface ApiError {
  message: string;
  status: number;
  /** Presente em respostas 422 (validação Laravel). */
  fieldErrors?: Record<string, string>;
  /** Payload bruto da resposta, para casos que precisem de mais detalhe. */
  data?: unknown;
}

/** Forma esperada do corpo de um 422 do Laravel. */
interface LaravelValidationBody {
  message?: string;
  errors?: Record<string, string[]>;
}

/** Chave usada para persistir o token de sessão mock entre refreshes do browser. */
export const AUTH_TOKEN_STORAGE_KEY = "mock_auth_token";

/** `true` quando a app está a correr contra o backend Laravel real (não o MSW). */
export const IS_REAL_BACKEND = import.meta.env.VITE_API_MOCK !== "true";

export const http: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  // Cookie-based Sanctum (Fase 4): envia/recebe o cookie de sessão httpOnly.
  withCredentials: true,
  // Anexa automaticamente o header X-XSRF-TOKEN a partir da cookie XSRF-TOKEN
  // em pedidos cross-origin (frontend :8080, backend :8000 em dev) — sem
  // isto o axios só o faz para pedidos same-origin.
  withXSRFToken: true,
  headers: {
    // Sinaliza XHR ao Laravel (faz o framework devolver JSON em vez de redirect).
    "X-Requested-With": "XMLHttpRequest",
    Accept: "application/json",
  },
});

/**
 * Obtém a cookie CSRF do Sanctum antes de qualquer pedido que altere estado
 * de sessão (login/registo) contra o backend real — exigido pelo fluxo SPA
 * cookie-based do Sanctum. Não aplicável em modo mock (o MSW não implementa
 * `/sanctum/csrf-cookie`, nem precisa: usa token em localStorage).
 */
export async function ensureCsrfCookie(): Promise<void> {
  const apiUrl = import.meta.env.VITE_API_URL ?? "";
  const root = apiUrl.replace(/\/api\/?$/, "");
  await axios.get(`${root}/sanctum/csrf-cookie`, { withCredentials: true });
}

// --- Interceptor de request -------------------------------------------------
http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // Modo mock (Opção B do comentário original): a "sessão" é um token simples
  // guardado em localStorage por `services/api/auth.ts` no login/registo, já
  // que os handlers MSW não têm cookies httpOnly reais para persistir sessão
  // entre refreshes. Quando o backend Laravel real (Sanctum cookie-based)
  // existir, isto passa a não ser necessário — o cookie viaja sozinho graças a
  // `withCredentials: true`.
  if (!config.headers) {
    config.headers = new AxiosHeaders();
  }
  const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

// --- Interceptor de response ------------------------------------------------
http.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status ?? 0;
    const body = error.response?.data as LaravelValidationBody | undefined;

    const apiError: ApiError = {
      message: body?.message || error.message || "Erro inesperado.",
      status,
      data: error.response?.data,
    };

    // 422 Laravel: { errors: { campo: [msg, ...] } } -> { campo: msg }
    if (status === 422 && body?.errors) {
      apiError.fieldErrors = Object.fromEntries(
        Object.entries(body.errors).map(([field, messages]) => [
          field,
          Array.isArray(messages) ? messages[0] : String(messages),
        ]),
      );
    }

    return Promise.reject(apiError);
  },
);

export default http;
