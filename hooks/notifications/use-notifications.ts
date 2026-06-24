"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { queryKeys } from "@/hooks/api/query-keys"
import type { ApiFetchError } from "@/lib/api/api-fetch"
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from "@/lib/api/notifications"

export type NotificationsData = {
  notifications: AppNotification[]
  unreadCount: number
}

// NT-API-003 안 읽은 알림 목록 조회.
export function useNotifications() {
  return useQuery<NotificationsData, ApiFetchError>({
    queryKey: queryKeys.notifications,
    queryFn: fetchNotifications,
  })
}

// 읽음 처리는 invalidate(재요청) 대신 낙관적 setQueryData로 해당 알림을 목록에서 제거한다.
// → 서버가 "안 읽은 것만" 주므로 캐시도 그에 맞춰 읽은 알림을 즉시 빼서,
//   "읽으면 사라진다" UX를 유지한다(재조회 결과와도 일치).
function patchCache(
  queryClient: ReturnType<typeof useQueryClient>,
  updater: (notifications: AppNotification[]) => AppNotification[],
) {
  const previous = queryClient.getQueryData<NotificationsData>(queryKeys.notifications)
  if (previous) {
    const next = updater(previous.notifications)
    queryClient.setQueryData<NotificationsData>(queryKeys.notifications, {
      ...previous,
      notifications: next,
      unreadCount: next.filter((n) => !n.isRead).length,
    })
  }
  return previous
}

// NT-API-004 특정 알림 읽음 (낙관적).
export function useMarkNotificationRead() {
  const queryClient = useQueryClient()

  return useMutation<unknown, ApiFetchError, number, { previous?: NotificationsData }>({
    mutationFn: markNotificationRead,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications })
      const previous = patchCache(queryClient, (notifications) =>
        notifications.filter((n) => n.id !== id),
      )
      return { previous }
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.notifications, context.previous)
      }
    },
  })
}

// NT-API-005 전체 읽음 (낙관적).
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()

  return useMutation<unknown, ApiFetchError, void, { previous?: NotificationsData }>({
    mutationFn: markAllNotificationsRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications })
      const previous = patchCache(queryClient, () => [])
      return { previous }
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.notifications, context.previous)
      }
    },
  })
}
