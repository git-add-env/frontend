"use client"

import { useQuery } from "@tanstack/react-query"

import { queryKeys } from "@/hooks/api/query-keys"
import type { ApiFetchError } from "@/lib/api/api-fetch"
import { fetchConferenceStatus, type ConferenceStatus } from "@/lib/api/dashboard"

// 회의 진행 상태 조회. 멤버(비모임장)는 이 isActive로 참여 버튼 활성 여부를 분기한다.
// 모임장이 회의를 시작/종료하면 멤버 쪽도 곧 반영되도록 활동중일 때 폴링한다.
export function useConferenceStatus(meetingId: number, enabled = true) {
  return useQuery<ConferenceStatus, ApiFetchError>({
    queryKey: queryKeys.meetings.conference(meetingId),
    queryFn: () => fetchConferenceStatus(meetingId),
    enabled,
    refetchInterval: enabled ? 15_000 : false,
    refetchOnWindowFocus: true,
  })
}
