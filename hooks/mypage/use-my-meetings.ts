"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { queryKeys } from "@/hooks/api/query-keys"
import type { ApiFetchError } from "@/lib/api/api-fetch"
import {
  cancelMembership,
  completeMeeting,
  deleteMeeting,
  fetchMyMeetings,
  type Meeting,
} from "@/lib/api/mypage"

type MeetingStatus = "recruiting" | "active" | "completed"

export function useMyMeetings(status?: MeetingStatus) {
  return useQuery<{ meetings: Meeting[] }, ApiFetchError, Meeting[]>({
    queryKey: queryKeys.meetings.mine(status),
    queryFn: () => fetchMyMeetings(status),
    select: (data) => data.meetings,
  })
}

// 취소/삭제/종료는 모두 내 모임 목록(상태 무관)을 바꾸므로 mineAll prefix로 한 번에 무효화.
function useMeetingActionMutation<T>(mutationFn: (meetingId: number) => Promise<T>) {
  const queryClient = useQueryClient()

  return useMutation<T, ApiFetchError, number>({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.meetings.mineAll })
    },
  })
}

export const useCancelMembership = () => useMeetingActionMutation(cancelMembership)
export const useCompleteMeeting = () => useMeetingActionMutation(completeMeeting)
export const useDeleteMeeting = () => useMeetingActionMutation(deleteMeeting)
