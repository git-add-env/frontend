"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { queryKeys } from "@/hooks/api/query-keys"
import type { ApiFetchError } from "@/lib/api/api-fetch"
import { createBookmark, deleteBookmark } from "@/lib/api/bookmarks"

type ToggleBookmarkVariables = {
  meetingId: number
  bookmarked: boolean
}

type BookmarkMutationContext = {
  meetingId: number
  previousBookmarked: boolean | undefined
}

export function useMeetingBookmarkMutation() {
  const queryClient = useQueryClient()

  return useMutation<void, ApiFetchError, ToggleBookmarkVariables, BookmarkMutationContext>({
    mutationFn: ({ meetingId, bookmarked }) =>
      bookmarked ? createBookmark(meetingId) : deleteBookmark(meetingId),
    onMutate: async ({ meetingId, bookmarked }) => {
      const queryKey = queryKeys.meetings.bookmarkState(meetingId)
      const previousBookmarked = queryClient.getQueryData<boolean>(queryKey)

      queryClient.setQueryData(queryKey, bookmarked)

      return { meetingId, previousBookmarked }
    },
    onError: (_error, _variables, context) => {
      if (!context) {
        return
      }

      const queryKey = queryKeys.meetings.bookmarkState(context.meetingId)

      if (context.previousBookmarked === undefined) {
        queryClient.removeQueries({ queryKey, exact: true })
        return
      }

      queryClient.setQueryData(queryKey, context.previousBookmarked)
    },
    onSuccess: async (_data, { meetingId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.meetings.list }),
        queryClient.invalidateQueries({ queryKey: queryKeys.meetings.detail(meetingId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.meetings.bookmarks }),
      ])
    },
  })
}

export function useMeetingBookmarkState(meetingId: number | undefined, fallback?: boolean) {
  const query = useQuery({
    queryKey:
      typeof meetingId === "number"
        ? queryKeys.meetings.bookmarkState(meetingId)
        : ["meetings", "missing", "bookmark-state"],
    queryFn: () => fallback ?? false,
    enabled: false,
  })

  return query.data ?? fallback
}
