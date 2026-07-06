import type { AxiosRequestConfig } from "axios";
import { http } from "@/lib/http";

/**
 * Helpers finos por cima do axios de `http.ts`.
 *
 * Cada helper devolve directamente `response.data` já tipado como `T`, para
 * que os serviços de módulo (services/api/*.ts) fiquem limpos de detalhes do
 * axios. Erros já vêm normalizados como `ApiError` pelo interceptor de http.ts.
 */

export async function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await http.get<T>(url, config);
  return data;
}

export async function apiPost<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const { data } = await http.post<T>(url, body, config);
  return data;
}

export async function apiPut<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const { data } = await http.put<T>(url, body, config);
  return data;
}

export async function apiPatch<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const { data } = await http.patch<T>(url, body, config);
  return data;
}

export async function apiDelete<T = void>(
  url: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  const { data } = await http.delete<T>(url, config);
  return data;
}
