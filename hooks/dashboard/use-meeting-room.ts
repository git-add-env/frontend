"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { queryKeys } from "@/hooks/api/query-keys"
import type { ApiFetchError } from "@/lib/api/api-fetch"
import { joinMeeting, startMeeting, type MeetingRoom } from "@/lib/api/dashboard"

// 모임장: 회의 시작 / 멤버: 진행 중인 회의 참여. 호출부에서 isLeader로 분기.
export function useStartMeeting(meetingId: number) {
  const queryClient = useQueryClient()

  return useMutation<MeetingRoom, ApiFetchError, void>({
    mutationFn: () => startMeeting(meetingId),
    onSuccess: () => {
      // 회의가 시작됐으니 진행 상태를 갱신 (배너 문구 전환 + 멤버 참여 활성화).
      queryClient.invalidateQueries({ queryKey: queryKeys.meetings.conference(meetingId) })
    },
  })
}

export function useJoinMeeting(meetingId: number) {
  return useMutation<MeetingRoom, ApiFetchError, void>({
    mutationFn: () => joinMeeting(meetingId),
  })
}
