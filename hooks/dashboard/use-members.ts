"use client"

import { useQuery } from "@tanstack/react-query"

import { queryKeys } from "@/hooks/api/query-keys"
import type { ApiFetchError } from "@/lib/api/api-fetch"
import { fetchMemberProfile, type MemberProfile } from "@/lib/api/dashboard"
import { fetchMeetingMembers, type MeetingMember } from "@/lib/api/meetings"

export function useMeetingMembers(meetingId: number) {
  return useQuery<{ members: MeetingMember[] }, ApiFetchError, MeetingMember[]>({
    queryKey: queryKeys.meetings.members(meetingId),
    queryFn: () => fetchMeetingMembers(meetingId),
    select: (data) => data.members,
  })
}

// userId가 null이면 비활성(모달 닫힘 상태). 열릴 때만 조회.
export function useMemberProfile(userId: number | null) {
  return useQuery<MemberProfile, ApiFetchError>({
    queryKey: queryKeys.memberProfile(userId ?? -1),
    queryFn: () => fetchMemberProfile(userId as number),
    enabled: userId !== null,
  })
}
