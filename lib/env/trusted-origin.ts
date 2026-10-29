/** Public site origin for QR links and Auth invite redirects. Never use request Host. */

export class MissingAppOriginError extends Error {
  readonly name = "MissingAppOriginError";
  readonly disabled: readonly string[];
  constructor(
    message = "APP_URL must be a public https origin in production.",
    disabled: readonly string[] = ["APP_URL", "NEXT_PUBLIC_APP_URL"],
  ) {
    super(message);
    this.disabled = disabled;
  }
}

export const AUTH_CONFIRM_PATH = "/auth/confirm";

export type TrustedOriginEnv = {
  APP_URL?: string;
  NEXT_PUBLIC_APP_URL?: string;
  VERCEL_URL?: string;
  VERCEL_ENV?: string;
  NODE_ENV?: string;
};

export function isProductionOriginRuntime(env: TrustedOriginEnv): boolean {
  if (env.VERCEL_ENV) {
    return env.VERCEL_ENV === "production";
  }
  return env.NODE_ENV === "production";
}

export function isLocalhostHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host.endsWith(".localhost")
  );
}

export function normalizeTrustedOrigin(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  const candidate = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }
    if (url.username || url.password) {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

function firstConfiguredOrigin(env: TrustedOriginEnv): string | null {
  const candidates = [env.APP_URL, env.NEXT_PUBLIC_APP_URL];
  if (!isProductionOriginRuntime(env)) {
    candidates.push(env.VERCEL_URL);
  }

  for (const value of candidates) {
    if (!value?.trim()) {
      continue;
    }
    const origin = normalizeTrustedOrigin(value);
    if (origin) {
      return origin;
    }
  }
  return null;
}

function isUsableProductionOrigin(origin: string | null): boolean {
  if (!origin) {
    return false;
  }
  const url = new URL(origin);
  return url.protocol === "https:" && !isLocalhostHostname(url.hostname);
}

export function disabledProductionOriginKeys(
  env: TrustedOriginEnv,
): string[] {
  const disabled: string[] = [];
  const appUrl = env.APP_URL?.trim()
    ? normalizeTrustedOrigin(env.APP_URL)
    : null;
  const publicUrl = env.NEXT_PUBLIC_APP_URL?.trim()
    ? normalizeTrustedOrigin(env.NEXT_PUBLIC_APP_URL)
    : null;
  if (!isUsableProductionOrigin(appUrl)) {
    disabled.push("APP_URL");
  }
  if (!isUsableProductionOrigin(publicUrl)) {
    disabled.push("NEXT_PUBLIC_APP_URL");
  }
  return disabled;
}

export function resolveTrustedAppOrigin(env: TrustedOriginEnv): string {
  const origin = firstConfiguredOrigin(env);
  const production = isProductionOriginRuntime(env);

  if (production) {
    if (!origin || isLocalhostHostname(new URL(origin).hostname)) {
      throw new MissingAppOriginError(
        "APP_URL must be a public https origin in production. Set APP_URL (or NEXT_PUBLIC_APP_URL) to the deployed site URL.",
        disabledProductionOriginKeys(env),
      );
    }
    if (new URL(origin).protocol !== "https:") {
      throw new MissingAppOriginError(
        "APP_URL must use https in production.",
        disabledProductionOriginKeys(env),
      );
    }
    return origin;
  }

  return origin ?? "http://localhost:3000";
}

export function joinOriginPath(origin: string, path: string): string {
  const base = origin.replace(/\/+$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`;
}

export function authConfirmRedirectUrl(origin: string): string {
  return joinOriginPath(origin, AUTH_CONFIRM_PATH);
}

export function resolveAuthConfirmRedirectUrl(env: TrustedOriginEnv): string {
  return authConfirmRedirectUrl(resolveTrustedAppOrigin(env));
}

export function originContainsLocalhost(value: string): boolean {
  return /localhost|127\.0\.0\.1|::1/i.test(value);
}
