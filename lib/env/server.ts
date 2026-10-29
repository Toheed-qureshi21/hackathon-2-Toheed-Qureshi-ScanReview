import "server-only";

import { z } from "zod";

import {
  logDisabledEnv,
  missingKeysFromZodIssues,
} from "@/lib/env/log-missing";

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function getServerEnv(): ServerEnv {
  const parsed = serverEnvSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
  });
  if (!parsed.success) {
    const disabled = missingKeysFromZodIssues(parsed.error.issues);
    const message = "Missing or invalid server environment (DATABASE_URL).";
    logDisabledEnv({ disabled, message });
    throw new Error(message);
  }
  return parsed.data;
}
