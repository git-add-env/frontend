"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { queryKeys } from "@/hooks/api/query-keys"
import type { ApiFetchError } from "@/lib/api/api-fetch"
import {
  createResource,
  deleteResource,
  fetchResources,
  type Resource,
} from "@/lib/api/dashboard"
import { notify } from "@/lib/notify"

export function useResources(meetingId: number) {
  return useQuery<{ resources: Resource[] }, ApiFetchError, Resource[]>({
    queryKey: queryKeys.meetings.resources(meetingId),
    queryFn: () => fetchResources(meetingId),
    select: (data) => data.resources,
  })
}

export function useCreateResource(meetingId: number) {
  const queryClient = useQueryClient()

  return useMutation<Resource, ApiFetchError, { title: string; url: string }>({
    mutationFn: (input) => createResource(meetingId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.meetings.resources(meetingId) })
      notify.success("링크를 추가했어요")
    },
  })
}

export function useDeleteResource(meetingId: number) {
  const queryClient = useQueryClient()

  return useMutation<void, ApiFetchError, number>({
    mutationFn: (resourceId) => deleteResource(meetingId, resourceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.meetings.resources(meetingId) })
      notify.success("링크를 삭제했어요")
    },
  })
}
