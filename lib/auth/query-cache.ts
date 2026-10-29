import type { QueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/hooks/queries/query-keys";

/** Remove cached authenticated user and organization data after logout. */
export function clearAuthSessionQueries(queryClient: QueryClient): void {
  queryClient.removeQueries({ queryKey: queryKeys.auth.me });
  queryClient.removeQueries({ queryKey: queryKeys.organization.current });
  queryClient.removeQueries({ queryKey: ["spots"] });
  queryClient.removeQueries({ queryKey: ["feedback"] });
}
