import type { QueryClient } from "@tanstack/react-query"

import { queryKeys } from "@/hooks/api/query-keys"

const authScopedQueryKeys = [
  queryKeys.auth.me,
  queryKeys.profile.me,
  queryKeys.meetings.mineAll,
  queryKeys.meetings.bookmarks,
  queryKeys.notifications,
] as const

export function clearAuthScopedQueries(queryClient: QueryClient) {
  authScopedQueryKeys.forEach((queryKey) => {
    queryClient.removeQueries({ queryKey })
  })
}

