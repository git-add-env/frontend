"use client"

import { useEffect, useState } from "react"
import { Calendar, Clock, Video } from "lucide-react"

import { fetchSchedules, type Schedule } from "@/lib/api/dashboard"
import { formatMeetingDate } from "@/lib/date"
import { findNextMeeting } from "@/lib/schedule"

type NextMeetingCardProps = {
  meetingId: number
}

export function NextMeetingCard({ meetingId }: NextMeetingCardProps) {
  const [schedules, setSchedules] = useState<Schedule[] | null>(null)

  useEffect(() => {
    fetchSchedules(meetingId)
      .then((res) => setSchedules(res.schedules))
      .catch(() => setSchedules([]))
  }, [meetingId])

  const next = schedules ? findNextMeeting(schedules) : null

  return (
    <div className="h-full rounded-2xl border border-border bg-card p-6">
      <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
        <Calendar className="size-4" />
        다음 회의 일정
      </h2>
      {!schedules ? (
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      ) : next ? (
        <div className="flex flex-col gap-4">
          <p className="text-base font-semibold">{next.title}</p>
          <div className="flex flex-col gap-5">
            <MeetingDetailRow
              icon={<Calendar className="size-4" />}
              label="날짜"
              value={formatMeetingDate(next.date)}
            />
            <MeetingDetailRow
              icon={<Clock className="size-4" />}
              label="시간"
              value={next.time}
            />
            <MeetingDetailRow
              icon={<Video className="size-4" />}
              label="방식"
              value={next.isMeeting ? "비대면 화상" : "대면"}
            />
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">예정된 회의가 없습니다.</p>
      )}
    </div>
  )
}

// 날짜/시간/방식을 아이콘 + 라벨 + 값 한 행으로 표시.
function MeetingDetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        {icon}
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  )
}
