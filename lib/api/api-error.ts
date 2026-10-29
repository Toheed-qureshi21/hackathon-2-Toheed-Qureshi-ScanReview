import type { ApiErrorBody, ApiEnvelope } from "@/lib/api/envelope";

export class ApiClientError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: Record<string, unknown>;

  constructor(
    code: string,
    message: string,
    status: number,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

/** Normalize a parsed JSON body from `/api/*` into data or a thrown `ApiClientError`. */
export function unwrapApiEnvelope<T>(
  body: unknown,
  httpStatus: number,
): T {
  if (!body || typeof body !== "object") {
    throw new ApiClientError(
      "INVALID_RESPONSE",
      "Unexpected API response.",
      httpStatus,
    );
  }

  const envelope = body as ApiEnvelope<T>;
  if (envelope.error) {
    throw apiErrorFromBody(envelope.error, httpStatus);
  }

  if (envelope.data === null || envelope.data === undefined) {
    throw new ApiClientError(
      "INVALID_RESPONSE",
      "Missing response data.",
      httpStatus,
    );
  }

  return envelope.data;
}

export function apiErrorFromBody(
  error: ApiErrorBody,
  httpStatus: number,
): ApiClientError {
  return new ApiClientError(
    error.code,
    error.message,
    httpStatus,
    error.details,
  );
}
