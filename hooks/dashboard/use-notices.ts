"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { queryKeys } from "@/hooks/api/query-keys"
import type { ApiFetchError } from "@/lib/api/api-fetch"
import {
  createNotice,
  deleteNotice,
  fetchNotices,
  updateNotice,
  type Notice,
} from "@/lib/api/dashboard"

export function useNotices(meetingId: number) {
  return useQuery<{ notices: Notice[] }, ApiFetchError, Notice[]>({
    queryKey: queryKeys.meetings.notices(meetingId),
    queryFn: () => fetchNotices(meetingId),
    select: (data) => data.notices,
  })
}

export function useCreateNotice(meetingId: number) {
  const queryClient = useQueryClient()

  return useMutation<Notice, ApiFetchError, { title: string; content: string }>({
    mutationFn: (input) => createNotice(meetingId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.meetings.notices(meetingId) })
    },
  })
}

export function useDeleteNotice(meetingId: number) {
  const queryClient = useQueryClient()

  return useMutation<void, ApiFetchError, number>({
    mutationFn: (noticeId) => deleteNotice(meetingId, noticeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.meetings.notices(meetingId) })
    },
  })
}

export function useUpdateNotice(meetingId: number) {
  const queryClient = useQueryClient()

  return useMutation<
    Notice,
    ApiFetchError,
    { noticeId: number; input: Partial<{ title: string; content: string }> }
  >({
    mutationFn: ({ noticeId, input }) => updateNotice(meetingId, noticeId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.meetings.notices(meetingId) })
    },
  })
}
