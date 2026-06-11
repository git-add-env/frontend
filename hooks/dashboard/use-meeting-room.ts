"use client"

import { useMutation } from "@tanstack/react-query"

import type { ApiFetchError } from "@/lib/api/api-fetch"
import { joinMeeting, startMeeting, type MeetingRoom } from "@/lib/api/dashboard"

// 모임장: 회의 시작 / 멤버: 진행 중인 회의 참여. 호출부에서 isLeader로 분기.
export function useStartMeeting(meetingId: number) {
  return useMutation<MeetingRoom, ApiFetchError, void>({
    mutationFn: () => startMeeting(meetingId),
  })
}

export function useJoinMeeting(meetingId: number) {
  return useMutation<MeetingRoom, ApiFetchError, void>({
    mutationFn: () => joinMeeting(meetingId),
  })
}
