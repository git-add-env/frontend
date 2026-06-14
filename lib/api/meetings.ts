// 모임 멤버 조회 헬퍼.

import { apiClient, type ApiClientOptions } from "./api-client"

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

export type MeetingDetail = MeetingSummary & {
  description?: string | null
  introduction?: string | null
  content?: string | null
  startDate?: string | null
  expectedDuration?: string | null
  duration?: string | null
  meetingSchedule?: string | null
  meetingType?: string | null
  region?: string | null
}

type MeetingDetailResponse =
  | MeetingDetail
  | { meeting: MeetingDetail }
  | { meetingDetail: MeetingDetail }
  | { detail: MeetingDetail }

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

export async function fetchMeetingDetail(meetingId: number) {
  try {
    const data = await apiClient<MeetingDetailResponse>(`/api/meetings/${meetingId}`, {
      auth: false,
    })

    return unwrapMeetingDetail(data)
  } catch (error) {
    const fallback = await fetchMeetingSummaryById(meetingId)

    if (fallback) {
      return fallback
    }

    throw error
  }
}

function unwrapMeetingDetail(data: MeetingDetailResponse) {
  if ("meeting" in data) {
    return data.meeting
  }

  if ("meetingDetail" in data) {
    return data.meetingDetail
  }

  if ("detail" in data) {
    return data.detail
  }

  return data
}

export function fetchMeetingMembers(meetingId: number, options?: ApiClientOptions) {
  return apiClient<{ members: MeetingMember[] }>(`/api/meetings/${meetingId}/members`, options)
}

async function fetchMeetingSummaryById(meetingId: number) {
  let cursor: number | null | undefined
  const visitedCursors = new Set<number>()

  while (true) {
    const data = await fetchMeetings({ cursor, size: 100 })
    const meeting = data.meetings.find((item) => item.meetingId === meetingId)

    if (meeting) {
      return meeting
    }

    if (!data.hasNext || data.nextCursor === null || visitedCursors.has(data.nextCursor)) {
      return null
    }

    visitedCursors.add(data.nextCursor)
    cursor = data.nextCursor
  }
}
