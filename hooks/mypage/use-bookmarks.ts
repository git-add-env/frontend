"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { queryKeys } from "@/hooks/api/query-keys"
import type { ApiFetchError } from "@/lib/api/api-fetch"
import { deleteBookmark } from "@/lib/api/bookmarks"
import { fetchMyBookmarks, type Bookmark } from "@/lib/api/mypage"

export function useMyBookmarks() {
  return useQuery<{ bookmarks: Bookmark[] }, ApiFetchError, Bookmark[]>({
    queryKey: queryKeys.meetings.bookmarks,
    queryFn: fetchMyBookmarks,
    select: (data) => data.bookmarks,
  })
}

export function useDeleteBookmark() {
  const queryClient = useQueryClient()

  return useMutation<void, ApiFetchError, number>({
    mutationFn: deleteBookmark,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.meetings.bookmarks })
    },
  })
}
