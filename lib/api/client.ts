import axios, { isAxiosError } from "axios";

import { ApiClientError, apiErrorFromBody, unwrapApiEnvelope } from "@/lib/api/api-error";
import type { ApiEnvelope } from "@/lib/api/envelope";

export const apiClient = axios.create({
  baseURL: "/api",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  timeout: 30_000,
  withCredentials: true,
});

apiClient.interceptors.response.use(
  (response) => {
    const status = response.status;
    const body = response.data as ApiEnvelope<unknown>;

    if (body?.error) {
      throw apiErrorFromBody(body.error, status);
    }

    if (status >= 400) {
      throw new ApiClientError(
        "HTTP_ERROR",
        "Request failed.",
        status,
      );
    }

    return response;
  },
  (error: unknown) => {
    if (isAxiosError(error)) {
      const status = error.response?.status ?? 0;
      const data = error.response?.data;
      if (
        data &&
        typeof data === "object" &&
        "error" in data &&
        (data as ApiEnvelope<unknown>).error
      ) {
        throw apiErrorFromBody(
          (data as ApiEnvelope<unknown>).error!,
          status || 500,
        );
      }
      if (error.code === "ECONNABORTED") {
        throw new ApiClientError(
          "TIMEOUT",
          "The request timed out. Try again.",
          status || 408,
        );
      }
      throw new ApiClientError(
        "NETWORK_ERROR",
        error.message || "Network request failed.",
        status || 0,
      );
    }
    throw error;
  },
);

/** Typed GET that returns envelope `data` after shared error handling. */
export async function apiGet<T>(path: string): Promise<T> {
  const response = await apiClient.get<ApiEnvelope<T>>(path);
  return unwrapApiEnvelope<T>(response.data, response.status);
}

/** Typed POST that returns envelope `data` after shared error handling. */
export async function apiPost<T, B = unknown>(
  path: string,
  body?: B,
): Promise<T> {
  const response = await apiClient.post<ApiEnvelope<T>>(path, body);
  return unwrapApiEnvelope<T>(response.data, response.status);
}
