/** Logs env names only — never values, secrets, or tokens. */
export function logDisabledEnv(input: {
  disabled: readonly string[];
  message: string;
}): void {
  console.error("[env]", {
    disabled: [...input.disabled],
    message: input.message,
  });
}

export function missingKeysFromZodIssues(
  issues: readonly { path: readonly PropertyKey[] }[],
): string[] {
  const keys = new Set<string>();
  for (const issue of issues) {
    const key = issue.path[0];
    if (typeof key === "string") {
      keys.add(key);
    }
  }
  return [...keys];
}
