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

export function fetchSchedules(meetingId: number) {
  return apiClient<{ schedules: Schedule[] }>(
    `/api/meetings/${meetingId}/schedules`,
  )
}

export function createSchedule(meetingId: number, input: ScheduleInput) {
  return apiClient<Schedule>(`/api/meetings/${meetingId}/schedules`, {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function updateSchedule(
  meetingId: number,
  scheduleId: number,
  input: Partial<ScheduleInput>,
) {
  return apiClient<Schedule>(
    `/api/meetings/${meetingId}/schedules/${scheduleId}`,
    { method: "PATCH", body: JSON.stringify(input) },
  )
}

export function deleteSchedule(meetingId: number, scheduleId: number) {
  return apiClient<void>(
    `/api/meetings/${meetingId}/schedules/${scheduleId}`,
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

export function fetchNotices(meetingId: number) {
  return apiClient<{ notices: Notice[] }>(`/api/meetings/${meetingId}/notices`)
}

export function createNotice(
  meetingId: number,
  input: { title: string; content: string },
) {
  return apiClient<Notice>(`/api/meetings/${meetingId}/notices`, {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function updateNotice(
  meetingId: number,
  noticeId: number,
  input: Partial<{ title: string; content: string }>,
) {
  return apiClient<Notice>(`/api/meetings/${meetingId}/notices/${noticeId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  })
}

export function deleteNotice(meetingId: number, noticeId: number) {
  return apiClient<void>(`/api/meetings/${meetingId}/notices/${noticeId}`, {
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

export function fetchResources(meetingId: number) {
  return apiClient<{ resources: Resource[] }>(
    `/api/meetings/${meetingId}/resources`,
  )
}

export function createResource(
  meetingId: number,
  input: { title: string; url: string },
) {
  return apiClient<Resource>(`/api/meetings/${meetingId}/resources`, {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export function deleteResource(meetingId: number, resourceId: number) {
  return apiClient<void>(
    `/api/meetings/${meetingId}/resources/${resourceId}`,
    { method: "DELETE" },
  )
}

// ---- 화상 회의 (DB-API-002~003) ----

export type MeetingRoom = {
  roomId: string
  token: string
  url: string
}

export function startMeeting(meetingId: number) {
  return apiClient<MeetingRoom>(`/api/meetings/${meetingId}/meetings`, {
    method: "POST",
  })
}

export function joinMeeting(meetingId: number) {
  return apiClient<MeetingRoom>(`/api/meetings/${meetingId}/meetings/join`)
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

