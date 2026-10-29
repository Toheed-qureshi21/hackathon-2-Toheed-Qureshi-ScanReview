/** TRD API envelope — shared between Route Handlers and the browser Axios client. */

export type ApiErrorBody = {
  code: string;
  message: string;
  details?: Record<string, unknown>;
};

export type ApiEnvelope<T> = {
  data: T | null;
  error: ApiErrorBody | null;
};
