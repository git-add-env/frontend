// 마이페이지(MP-API 001~008) 호출 헬퍼. 각 함수는 명세서의 응답 스키마를 그대로 반환한다.

import { apiClient } from "./api-client"
import { requestImageUploadPresign, uploadImage } from "./uploads"

export type Profile = {
  id: number
  email: string
  nickname: string
  profileImage: string | null
  introduction: string | null
  job: string | null
  career: string | null
  techStacks: string[]
}

export type ProfilePatch = {
  nickname?: string
  introduction?: string
  profileImage?: string | null
  job?: string
  career?: string
  techStacks?: string[]
}

export type MeetingPosition = {
  id: number
  name: string
  recruitCount: number
  currentCount: number
  isClosed: boolean
  description: string | null
}

// 백엔드 MeetingSummary 응답 그대로. status: "RECRUITING" | "ACTIVE" | "COMPLETED",
// category: "PROJECT" | "HACKATHON" | "CONTEST" (영어 enum).
// isLeader: 현재 로그인 유저가 이 모임의 모임장인지 여부.
export type Meeting = {
  meetingId: number
  thumbnailUrl: string | null
  category: string
  title: string
  techStacks: string[]
  isBookmarked: boolean
  isDeadlineToday: boolean
  isLeader: boolean
  deadline: string
  recruitSummary: { currentCount: number; totalCount: number }
  positions: MeetingPosition[]
  status: string
}

// 북마크 목록 응답(MP-API-006). 백엔드 BookmarkItemResponse = { id, ...MeetingSummary(@JsonUnwrapped) }.
// 즉 Meeting 전체 필드(thumbnailUrl·status·isLeader 등) + 북마크 PK(id)가 그대로 내려온다.
// (Swagger 스키마는 @JsonUnwrapped라 일부만 노출되지만 실제 JSON엔 모두 포함)
export type Bookmark = Meeting & {
  id: number
}

export async function fetchMyProfile(): Promise<Profile> {
  const res = await apiClient<{ user: Profile }>("/api/users/me")
  return res.user
}

export async function patchMyProfile(patch: ProfilePatch): Promise<Profile> {
  const res = await apiClient<{ user: Profile }>("/api/users/me", {
    method: "PATCH",
    body: JSON.stringify(patch),
  })
  return res.user
}

export function requestProfileImagePresign(fileName: string, fileType: string) {
  return requestImageUploadPresign(fileName, fileType)
}

export async function uploadProfileImage(file: File): Promise<string> {
  return uploadImage(file)
}

export function fetchMyMeetings(status?: "recruiting" | "active" | "completed") {
  const query = status ? `?status=${status}` : ""
  return apiClient<{ meetings: Meeting[] }>(`/api/users/me/meetings${query}`)
}

export function fetchMyBookmarks() {
  return apiClient<{ bookmarks: Bookmark[] }>("/api/users/me/bookmarks")
}

// MP-API-009 멤버 모임 참여 취소 (모집중에서만 가능).
export function cancelMembership(meetingId: number) {
  return apiClient<void>(`/api/meetings/${meetingId}/members/me`, {
    method: "DELETE",
  })
}

// MP-API-010 모임장 모임 삭제. 멤버 1명 이상이면 소프트 삭제 응답(data), 0명이면 data: null.
export type DeleteMeetingResult =
  | { deleted: true; type: "soft"; notifiedCount: number }
  | null

export function deleteMeeting(meetingId: number) {
  return apiClient<DeleteMeetingResult>(`/api/meetings/${meetingId}`, {
    method: "DELETE",
  })
}

// MP-API-011 모임장 모임 종료 (활동중 → 완료). 요청 바디 없음.
// 종료 시 멤버 전원에게 알림 발송, notifiedCount로 알림 받은 수 반환.
export type CompleteMeetingResult = {
  meetingId: number
  status: "COMPLETED"
  completedAt: string
  notifiedCount: number
}

export function completeMeeting(meetingId: number) {
  return apiClient<CompleteMeetingResult>(`/api/meetings/${meetingId}/complete`, {
    method: "POST",
  })
}
