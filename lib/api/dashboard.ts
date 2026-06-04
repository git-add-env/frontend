// 대시보드(개요/일정/멤버) 호출 헬퍼. 응답 스키마는 명세서를 그대로 따른다.

import { apiClient } from "./api-client"

// ---- 일정 (DB-API-011~014) ----

export type Schedule = {
  id: number
  title: string
  date: string
  time: string
  description: string | null
  isMeeting: boolean
  createdAt: string
}

export type ScheduleInput = {
  title: string
  date: string
  time: string
  description?: string | null
  isMeeting?: boolean
}

export function fetchSchedules(gatheringId: number) {
  return apiClient<{ schedules: Schedule[] }>(
    `/api/meetings/${gatheringId}/schedules`,
  )
}

export function createSchedule(gatheringId: number, input: ScheduleInput) {
  return apiClient<Schedule>(`/api/meetings/${gatheringId}/schedules`, {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function updateSchedule(
  gatheringId: number,
  scheduleId: number,
  input: Partial<ScheduleInput>,
) {
  return apiClient<Schedule>(
    `/api/meetings/${gatheringId}/schedules/${scheduleId}`,
    { method: "PATCH", body: JSON.stringify(input) },
  )
}

export function deleteSchedule(gatheringId: number, scheduleId: number) {
  return apiClient<void>(
    `/api/meetings/${gatheringId}/schedules/${scheduleId}`,
    { method: "DELETE" },
  )
}

// ---- 공지 (DB-API-004~007) ----

export type Notice = {
  id: number
  title: string
  content: string
  createdAt: string
  updatedAt: string
}

export function fetchNotices(gatheringId: number) {
  return apiClient<{ notices: Notice[] }>(`/api/meetings/${gatheringId}/notices`)
}

export function createNotice(
  gatheringId: number,
  input: { title: string; content: string },
) {
  return apiClient<Notice>(`/api/meetings/${gatheringId}/notices`, {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function updateNotice(
  gatheringId: number,
  noticeId: number,
  input: Partial<{ title: string; content: string }>,
) {
  return apiClient<Notice>(`/api/meetings/${gatheringId}/notices/${noticeId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  })
}

export function deleteNotice(gatheringId: number, noticeId: number) {
  return apiClient<void>(`/api/meetings/${gatheringId}/notices/${noticeId}`, {
    method: "DELETE",
  })
}

// ---- 자료실 (DB-API-008~010) ----

export type Resource = {
  id: number
  title: string
  url: string
  createdAt: string
}

export function fetchResources(gatheringId: number) {
  return apiClient<{ resources: Resource[] }>(
    `/api/meetings/${gatheringId}/resources`,
  )
}

export function createResource(
  gatheringId: number,
  input: { title: string; url: string },
) {
  return apiClient<Resource>(`/api/meetings/${gatheringId}/resources`, {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function deleteResource(gatheringId: number, resourceId: number) {
  return apiClient<void>(
    `/api/meetings/${gatheringId}/resources/${resourceId}`,
    { method: "DELETE" },
  )
}

// ---- 화상 회의 (DB-API-002~003) ----

export type MeetingRoom = {
  roomId: string
  token: string
  url: string
}

export function startMeeting(gatheringId: number) {
  return apiClient<MeetingRoom>(`/api/meetings/${gatheringId}/meetings`, {
    method: "POST",
  })
}

export function joinMeeting(gatheringId: number) {
  return apiClient<MeetingRoom>(`/api/meetings/${gatheringId}/meetings/join`)
}

// ---- 멤버 프로필 (DB-API-016) ----

export type MemberProfile = {
  id: number
  nickname: string
  profileImage: string | null
  introduction: string | null
  job: string | null
  career: string | null
  techStacks: string[]
}

export async function fetchMemberProfile(userId: number): Promise<MemberProfile> {
  const res = await apiClient<{ user: MemberProfile }>(`/api/users/${userId}/profile`)
  return res.user
}

