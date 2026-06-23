"use client"

import { useQueryClient } from "@tanstack/react-query"
import { Bell, Calendar, Check, CheckCheck, Clock, Video, X } from "lucide-react"
import { useEffect, useState } from "react"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { queryKeys } from "@/hooks/api/query-keys"
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  type NotificationsData,
} from "@/hooks/notifications/use-notifications"
import { issueSseToken, type AppNotification, type NotificationType } from "@/lib/api/notifications"
import { notify } from "@/lib/notify"
import { cn } from "@/lib/utils"

const TYPE_ICON: Record<NotificationType, typeof Bell> = {
  APPLICATION_COMPLETE: Check,
  MEETING_CONFIRMED: Calendar,
  CONFERENCE_STARTED: Video,
  BOOKMARK_DEADLINE: Clock,
  MEETING_CANCELLED: X,
  MEETING_COMPLETED: CheckCheck,
}

// 읽지 않은 알림 표시 점. 마운트 시 핑을 5초만 보여주고 정적 점으로 고정한다.
// 부모가 key={unreadCount}로 렌더 → 새로고침·새 알림 수신 때마다 리마운트되어 핑이 다시 돈다.
function UnreadDot() {
  const [pinging, setPinging] = useState(true)
  useEffect(() => {
    const timer = setTimeout(() => setPinging(false), 5000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <span className="absolute right-2 top-2 flex size-3 items-center justify-center">
      {pinging && (
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#1abcfe] motion-reduce:animate-none" />
      )}
      <span className="relative inline-flex size-2 rounded-full bg-[#1abcfe] ring-2 ring-background" />
      <span className="sr-only">읽지 않은 알림 있음</span>
    </span>
  )
}

// NT-001~005: 알림 팝오버 + SSE 실시간 수신 + 토스트 + 전체 읽음.
export function NotificationBell() {
  const queryClient = useQueryClient()
  const { data, isError } = useNotifications()
  const markRead = useMarkNotificationRead()
  const markAll = useMarkAllNotificationsRead()

  const notifications = data?.notifications ?? []
  const unreadCount = notifications.filter((n) => !n.isRead).length

  // NT-003 SSE 연결: 단기 토큰(expiresIn초) 발급 → EventSource.
  // 만료 직전(expiresIn-5s)에 선제적으로 새 토큰으로 갈아끼워 401·끊김을 방지한다.
  // onerror는 네트워크 단절 등 예기치 못한 끊김용 백업 재연결.
  useEffect(() => {
    let source: EventSource | null = null
    let refreshTimer: ReturnType<typeof setTimeout> | null = null
    let retryTimer: ReturnType<typeof setTimeout> | null = null
    let closed = false

    function clearTimers() {
      if (refreshTimer) clearTimeout(refreshTimer)
      if (retryTimer) clearTimeout(retryTimer)
      refreshTimer = null
      retryTimer = null
    }

    async function connect() {
      if (closed) return

      // 환경변수 미설정 시 연결 시도하지 않음 (localhost 폴백은 배포 오설정을 가려
      // 잘못된 엔드포인트로 무한 재시도하게 만들므로 제거).
      const baseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL
      if (!baseUrl) return

      // 이전 연결·타이머 정리 후 새로 연결 (선제 재연결 시 깔끔히 교체).
      clearTimers()
      source?.close()
      source = null

      try {
        const { token, expiresIn } = await issueSseToken()
        if (closed) return

        const es = new EventSource(`${baseUrl}/api/notifications/stream?token=${token}`)
        source = es

        es.onmessage = (event) => {
          try {
            const incoming = JSON.parse(event.data) as AppNotification
            // SSE(push)로 받은 알림을 React Query 캐시 맨 앞에 꽂는다.
            let inserted = false
            queryClient.setQueryData<NotificationsData>(queryKeys.notifications, (old) => {
              const base = old ?? { notifications: [], unreadCount: 0 }
              if (base.notifications.some((n) => n.id === incoming.id)) return base
              inserted = true
              const next = [incoming, ...base.notifications]
              return { ...base, notifications: next, unreadCount: next.filter((n) => !n.isRead).length }
            })
            // 신규 삽입된 경우에만 토스트 (중복 SSE 이벤트 반복 노출 방지).
            if (inserted) notify.info(incoming.message)
          } catch {
            /* 파싱 실패 무시 */
          }
        }

        es.onerror = () => {
          // 선제 재연결로 이미 교체됐거나 언마운트면 무시.
          if (closed || source !== es) return
          es.close()
          source = null
          clearTimers()
          retryTimer = setTimeout(connect, 3000)
        }

        // 만료 5초 전 선제 재연결 (서버가 401 내기 전에 교체). 최소 5초 보장.
        const refreshMs = Math.max(expiresIn - 5, 5) * 1000
        refreshTimer = setTimeout(connect, refreshMs)
      } catch {
        if (!closed) retryTimer = setTimeout(connect, 3000)
      }
    }

    connect()

    return () => {
      closed = true
      clearTimers()
      source?.close()
      source = null
    }
  }, [queryClient])

  function onClickNotification(notification: AppNotification) {
    if (notification.isRead) return
    markRead.mutate(notification.id)
  }

  function onReadAll() {
    if (unreadCount === 0) return
    markAll.mutate()
  }

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          "relative inline-flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-accent-foreground",
          // 읽지 않은 알림이 있으면 아이콘 색만 hover 색으로 상시 적용해 강조(배경 없음).
          unreadCount > 0 && "text-accent-foreground",
        )}
        aria-label="알림"
      >
        <Bell className="size-5" />
        {unreadCount > 0 && <UnreadDot key={unreadCount} />}
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <span className="text-sm font-semibold">알림</span>
          <button
            type="button"
            onClick={onReadAll}
            disabled={unreadCount === 0}
            className="text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          >
            모두 읽음
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {isError ? (
            <p className="px-3 py-6 text-center text-sm text-destructive">
              알림을 불러오지 못했습니다.
            </p>
          ) : notifications.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              알림이 없습니다.
            </p>
          ) : (
            <ul className="flex flex-col">
              {notifications.map((notification) => {
                const Icon = TYPE_ICON[notification.type] ?? Bell
                return (
                  <li key={notification.id}>
                    <button
                      type="button"
                      onClick={() => onClickNotification(notification)}
                      className={cn(
                        "flex w-full items-start gap-3 px-3 py-3 text-left transition-colors hover:bg-accent",
                        !notification.isRead && "bg-accent/40",
                      )}
                    >
                      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
                        <Icon className="size-4" />
                      </span>
                      <span className="flex flex-1 flex-col gap-0.5">
                        <span className="text-base leading-snug">{notification.message}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(notification.createdAt)}
                        </span>
                      </span>
                      {!notification.isRead && (
                        <span className="mt-1 size-2 shrink-0 rounded-full bg-[#1abcfe]" />
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function formatTime(iso: string): string {
  const date = new Date(iso)
  const diffMs = Date.now() - date.getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return "방금 전"
  if (minutes < 60) return `${minutes}분 전`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}시간 전`
  const days = Math.floor(hours / 24)
  return `${days}일 전`
}
