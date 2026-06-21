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
  isLeader?: boolean
  members?: MeetingMember[]
  description?: string | null
  introduction?: string | null
  content?: string | null
  additionalNotice?: string | null
  startDate?: string | null
  expectedDuration?: string | null
  duration?: string | null
  meetingSchedule?: string | null
  meetingType?: string | null
  region?: string | null
}

export type MeetingUpsertPosition = {
  id?: number
  name: string
  recruitCount: number
  description?: string | null
}

export type MeetingUpsertPayload = {
  title: string
  category: string
  description: string
  additionalNotice?: string | null
  thumbnailUrl?: string | null
  techStacks: string[]
  deadline: string
  startDate: string
  expectedDuration: string
  meetingSchedule: string
  positions: MeetingUpsertPosition[]
}

export type ApplyMeetingPayload = {
  positionId: number
}

type MeetingDetailResponse =
  | MeetingDetail
  | { meeting: MeetingDetail }
  | { meetingDetail: MeetingDetail }
  | { detail: MeetingDetail }

type MeetingMutationResponse =
  | { meetingId: number }
  | { id: number }
  | { meeting: { meetingId: number } }
  | { meetingDetail: { meetingId: number } }

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
}: MeetingListParams = {}, options?: ApiClientOptions) {
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
    auth: options?.auth ?? false,
  })
}

export async function fetchMeetingDetail(
  meetingId: number,
  options?: ApiClientOptions,
): Promise<MeetingDetail> {
  const data = await apiClient<MeetingDetailResponse>(`/api/meetings/${meetingId}`, {
    auth: options?.auth ?? false,
  })

  return unwrapMeetingDetail(data)
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

export function applyMeeting(meetingId: number, payload: ApplyMeetingPayload) {
  return apiClient<void>(`/api/meetings/${meetingId}/apply`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function createMeeting(payload: MeetingUpsertPayload) {
  return apiClient<MeetingMutationResponse>("/api/meetings", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function updateMeeting(meetingId: number, payload: MeetingUpsertPayload) {
  return apiClient<MeetingMutationResponse>(`/api/meetings/${meetingId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
}

export function getMeetingMutationId(data: MeetingMutationResponse) {
  if ("meetingId" in data) {
    return data.meetingId
  }

  if ("id" in data) {
    return data.id
  }

  if ("meeting" in data) {
    return data.meeting.meetingId
  }

  if ("meetingDetail" in data && typeof data.meetingDetail.meetingId === "number") {
    return data.meetingDetail.meetingId
  }

  throw new Error("지원하지 않는 모임 생성/수정 응답 형식입니다.")
}

export function normalizeMeetingPositions(positions: MeetingPosition[] = []) {
  const positionByName = new Map<string, MeetingPosition>()

  positions.forEach((position) => {
    const key = getPositionNameKey(position)
    const current = positionByName.get(key)

    if (!current || position.id > current.id) {
      positionByName.set(key, position)
    }
  })

  return Array.from(positionByName.values()).sort((a, b) => a.id - b.id)
}

function getPositionNameKey(position: MeetingPosition) {
  const normalizedName = position.name.trim().toLowerCase()

  return normalizedName || `position-${position.id}`
}
