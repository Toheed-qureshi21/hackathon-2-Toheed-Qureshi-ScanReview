import type { QueryClient } from "@tanstack/react-query";

/** Wipe all React Query cache so the next signed-in user never sees prior session data. */
export function clearAuthSessionQueries(queryClient: QueryClient): void {
  queryClient.clear();
}
