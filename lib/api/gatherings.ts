// 모임찾기 - 목록/상세 호출 헬퍼

import { apiClient } from "./api-client"

export type GatheringListItem = {
  id: number
  title: string
  category: string
  currentMembers: number
  maxMembers: number
  deadline: string
  status: string
  isCompleted: boolean
}

export type NextMeeting = {
  id: number
  title: string
  date: string
  time: string
}

export type GatheringDetail = GatheringListItem & {
  isOwner: boolean
  description: string
  techStacks: string[]
  owner: {
    id: number
    nickname: string
    job: string | null
  }
  nextMeeting: NextMeeting | null
}

export function fetchGatherings() {
  return apiClient<{ meetings: GatheringListItem[]; nextCursor: number | null; hasNext: boolean }>("/api/meetings")
}

export function fetchGatheringDetail(id: number) {
  return apiClient<GatheringDetail>(`/api/meetings/${id}`)
}

export type GatheringMember = {
  id: number
  nickname: string
  profileImage: string | null
  job: string | null
  isOwner: boolean
}

export function fetchGatheringMembers(id: number) {
  return apiClient<{ members: GatheringMember[] }>(`/api/meetings/${id}/members`)
}
