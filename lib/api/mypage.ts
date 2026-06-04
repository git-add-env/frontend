// 마이페이지(MP-API 001~008) 호출 헬퍼. 각 함수는 명세서의 응답 스키마를 그대로 반환한다.

import { apiClient } from "./api-client"

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
// 주의: 목록 응답엔 isOwner/isLeader가 없음 → 모임장/참여자 구분 불가 (백엔드 추가 대기).
export type Meeting = {
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
  status: string
}

export type Bookmark = {
  id: number
  meetingId: number
  title: string
  category: string
  deadline: string
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

// 공용 이미지 업로드 presign 엔드포인트(POST /api/uploads/images). 썸네일·프로필 공통.
// 흐름: ① presign 발급 → ② uploadUrl로 S3 직접 PUT → ③ imageUrl을 patchMyProfile({ profileImage })로 저장.
export function requestProfileImagePresign(fileName: string, fileType: string) {
  return apiClient<{ uploadUrl: string; imageUrl: string }>(
    "/api/uploads/images",
    { method: "POST", body: JSON.stringify({ fileName, fileType }) },
  )
}

// presign + S3(PUT)까지 수행하고 저장용 imageUrl을 반환한다. 프로필 저장은 호출부에서 patchMyProfile로.
export async function uploadProfileImage(file: File): Promise<string> {
  const { uploadUrl, imageUrl } = await requestProfileImagePresign(file.name, file.type)
  // S3는 우리 API가 아니므로 apiClient 대신 raw fetch로 PUT.
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  })
  if (!res.ok) {
    throw new Error("이미지 업로드에 실패했습니다. 다시 시도해주세요.")
  }
  return imageUrl
}

export function fetchMyMeetings(status?: "recruiting" | "active" | "completed") {
  const query = status ? `?status=${status}` : ""
  return apiClient<{ meetings: Meeting[] }>(`/api/users/me/meetings${query}`)
}

export function fetchMyBookmarks() {
  return apiClient<{ bookmarks: Bookmark[] }>("/api/users/me/bookmarks")
}

export function deleteBookmark(meetingId: number) {
  return apiClient<void>(`/api/bookmarks/${meetingId}`, { method: "DELETE" })
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
