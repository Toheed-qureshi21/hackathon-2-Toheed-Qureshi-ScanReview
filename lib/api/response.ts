import { NextResponse } from "next/server";

export type ApiErrorBody = {
  code: string;
  message: string;
  details?: Record<string, unknown>;
};

export type ApiSuccess<T> = {
  data: T;
  error: null;
};

export type ApiFailure = {
  data: null;
  error: ApiErrorBody;
};

export function jsonSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ data, error: null } satisfies ApiSuccess<T>, {
    status,
  });
}

export function jsonError(
  code: string,
  message: string,
  status: number,
  details?: Record<string, unknown>,
) {
  return NextResponse.json(
    {
      data: null,
      error: { code, message, ...(details ? { details } : {}) },
    } satisfies ApiFailure,
    { status },
  );
}
