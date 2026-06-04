// 모임 멤버 조회 헬퍼.

import { apiClient } from "./api-client"

// GET /api/meetings/{id}/members 응답(MemberSummary) 그대로.
export type MeetingMember = {
  id: number
  profileImage: string | null
  nickname: string
  job: string | null
  positionName: string | null
  isLeader: boolean
}

export function fetchMeetingMembers(meetingId: number) {
  return apiClient<{ members: MeetingMember[] }>(`/api/meetings/${meetingId}/members`)
}
