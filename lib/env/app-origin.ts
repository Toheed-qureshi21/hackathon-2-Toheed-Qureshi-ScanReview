import "server-only";

import { logDisabledEnv } from "@/lib/env/log-missing";
import {
  MissingAppOriginError,
  resolveAuthConfirmRedirectUrl,
  resolveTrustedAppOrigin,
  type TrustedOriginEnv,
} from "@/lib/env/trusted-origin";

function processOriginEnv(): TrustedOriginEnv {
  return {
    APP_URL: process.env.APP_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    VERCEL_URL: process.env.VERCEL_URL,
    VERCEL_ENV: process.env.VERCEL_ENV,
    NODE_ENV: process.env.NODE_ENV,
  };
}

function withLoggedOrigin<T>(read: (env: TrustedOriginEnv) => T): T {
  try {
    return read(processOriginEnv());
  } catch (error) {
    if (error instanceof MissingAppOriginError) {
      logDisabledEnv({
        disabled: error.disabled,
        message: error.message,
      });
    }
    throw error;
  }
}

/** Trusted site origin for public QR URLs — never derive from request Host. */
export function getTrustedAppOrigin(): string {
  return withLoggedOrigin(resolveTrustedAppOrigin);
}

/** Absolute /auth/confirm URL passed to Supabase Auth as invite redirectTo. */
export function getAuthConfirmRedirectUrl(): string {
  return withLoggedOrigin(resolveAuthConfirmRedirectUrl);
}
