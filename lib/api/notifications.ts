// 알림(NT-API-001~005) 호출 헬퍼.

import { apiClient } from "./api-client"

export type NotificationType =
  | "APPLICATION_COMPLETE"
  | "MEETING_CONFIRMED"
  | "CONFERENCE_STARTED"
  | "BOOKMARK_DEADLINE"
  | "MEETING_CANCELLED"
  | "MEETING_COMPLETED"

export type AppNotification = {
  id: number
  type: NotificationType
  message: string
  meetingId: number
  isRead: boolean
  createdAt: string
}

// NT-API-001 SSE 연결용 단기 토큰 발급.
export function issueSseToken() {
  return apiClient<{ token: string; expiresIn: number }>(
    "/api/notifications/token",
    { method: "POST" },
  )
}

// NT-API-003 알림 목록 + 읽지 않은 수.
export function fetchNotifications() {
  return apiClient<{ notifications: AppNotification[]; unreadCount: number }>(
    "/api/notifications",
  )
}

// NT-API-004 특정 알림 읽음.
export function markNotificationRead(notificationId: number) {
  return apiClient<{ id: number; isRead: boolean }>(
    `/api/notifications/${notificationId}/read`,
    { method: "PATCH" },
  )
}

// NT-API-005 전체 읽음.
export function markAllNotificationsRead() {
  return apiClient<{ updatedCount: number }>("/api/notifications/read-all", {
    method: "PATCH",
  })
}
