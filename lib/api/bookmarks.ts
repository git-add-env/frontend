import { apiClient } from "@/lib/api/api-client"

export function createBookmark(meetingId: number) {
  return apiClient<void>(`/api/bookmarks/${meetingId}`, { method: "POST" })
}

export function deleteBookmark(meetingId: number) {
  return apiClient<void>(`/api/bookmarks/${meetingId}`, { method: "DELETE" })
}
