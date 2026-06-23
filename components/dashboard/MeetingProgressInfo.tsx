"use client"

import { useQuery } from "@tanstack/react-query"
import { Calendar, CalendarCheck, Clock } from "lucide-react"

import { queryKeys } from "@/hooks/api/query-keys"
import { fetchMeetingDetail } from "@/lib/api/meetings"
import { formatMeetingDate } from "@/lib/date"
import { cn } from "@/lib/utils"

type MeetingProgressInfoProps = {
  meetingId: number
}

// 모임 상세의 진행 정보(시작 예정일·진행 기간·회의 일정)를 3개 카드로 표시.
export function MeetingProgressInfo({ meetingId }: MeetingProgressInfoProps) {
  const { data } = useQuery({
    queryKey: queryKeys.meetings.detail(meetingId),
    queryFn: () => fetchMeetingDetail(meetingId),
  })

  const items = [
    {
      label: "시작 예정일",
      value: data?.startDate ? formatMeetingDate(data.startDate) : "미정",
      icon: Calendar,
      iconClass: "bg-blue-50 text-blue-500",
    },
    {
      label: "진행 기간",
      value: data?.expectedDuration ?? data?.duration ?? "미정",
      icon: Clock,
      iconClass: "bg-green-50 text-green-600",
    },
    {
      label: "회의 일정",
      value: data?.meetingSchedule ?? "미정",
      icon: CalendarCheck,
      iconClass: "bg-purple-50 text-purple-500",
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {items.map(({ label, value, icon: Icon, iconClass }) => (
        <div
          key={label}
          className="flex items-center gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm"
        >
          <span
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-xl",
              iconClass,
            )}
          >
            <Icon className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="truncate text-sm font-bold">{value}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
