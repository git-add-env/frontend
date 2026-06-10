// 모임 멤버 조회 헬퍼.

import { apiClient } from "./api-client"

export type MeetingPosition = {
  id: number
  name: string
  recruitCount: number
  currentCount: number
  isClosed?: boolean
  description?: string | null
}

// 백엔드 MeetingSummary 응답 그대로.
export type MeetingSummary = {
  meetingId: number
  thumbnailUrl: string | null
  category: string
  title: string
  techStacks: string[]
  isBookmarked: boolean
  isDeadlineToday: boolean
  deadline: string
  recruitSummary: { currentCount: number; totalCount: number }
  positions: MeetingPosition[]
  status?: string
}

export type MeetingListResponse = {
  meetings: MeetingSummary[]
  nextCursor: number | null
  hasNext: boolean
}

export type MeetingListParams = {
  cursor?: number | null
  size?: number
  category?: string
  keyword?: string
  sort?: string
}

// GET /api/meetings/{id}/members 응답(MemberSummary) 그대로.
export type MeetingMember = {
  id: number
  profileImage: string | null
  nickname: string
  job: string | null
  positionName: string | null
  isLeader: boolean
}

export function fetchMeetings({
  cursor,
  size = 6,
  category = "ALL",
  keyword,
  sort = "latest",
}: MeetingListParams = {}) {
  const params = new URLSearchParams({
    size: String(size),
    category,
    sort,
  })

  if (cursor !== undefined && cursor !== null) {
    params.set("cursor", String(cursor))
  }

  if (keyword) {
    params.set("keyword", keyword)
  }

  return apiClient<MeetingListResponse>(`/api/meetings?${params.toString()}`, {
    auth: false,
  })
}

export function fetchMeetingMembers(meetingId: number) {
  return apiClient<{ members: MeetingMember[] }>(`/api/meetings/${meetingId}/members`)
}
