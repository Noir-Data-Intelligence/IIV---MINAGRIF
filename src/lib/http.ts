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

export const http: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  // Cookie-based Sanctum (Fase 4): envia/recebe o cookie de sessão httpOnly.
  withCredentials: true,
  headers: {
    // Sinaliza XHR ao Laravel (faz o framework devolver JSON em vez de redirect).
    "X-Requested-With": "XMLHttpRequest",
    Accept: "application/json",
  },
});

// --- Interceptor de request -------------------------------------------------
http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // TODO Fase 4: injectar Authorization/cookie quando Sanctum estiver activo.
  // Em cookie-based (Opção A) o cookie httpOnly viaja automaticamente graças a
  // `withCredentials: true` — basta garantir o header X-XSRF-TOKEN. Em modo
  // token (Opção B) ler o bearer token do storage e fazer:
  //   config.headers.set("Authorization", `Bearer ${token}`);
  // Deixado explícito aqui para ser o único ponto de injecção de auth.
  if (!config.headers) {
    config.headers = new AxiosHeaders();
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
