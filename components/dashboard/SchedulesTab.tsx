"use client"

import { format } from "date-fns"
import { useState } from "react"
import { Calendar, ChevronDown, Trash2 } from "lucide-react"

import { Calendars } from "@/components/common/Calendars"
import { TimePicker } from "@/components/common/TimePicker"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  useCreateSchedule,
  useDeleteSchedule,
  useSchedules,
} from "@/hooks/dashboard/use-schedules"
import { ApiFetchError } from "@/lib/api/api-fetch"
import type { Schedule } from "@/lib/api/dashboard"
import { errorMessage } from "@/lib/api/error"
import { findNextMeeting, splitSchedules } from "@/lib/schedule"
import { cn } from "@/lib/utils"

type SchedulesTabProps = {
  meetingId: number
  isLeader: boolean
}

export function SchedulesTab({ meetingId, isLeader }: SchedulesTabProps) {
  const { data: schedules, isError } = useSchedules(meetingId)
  const createSchedule = useCreateSchedule(meetingId)
  const deleteSchedule = useDeleteSchedule(meetingId)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pastOpen, setPastOpen] = useState(false)

  // 입력 폼.
  const [title, setTitle] = useState("")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [description, setDescription] = useState("")
  const [isMeeting, setIsMeeting] = useState(false)
  const [dateOpen, setDateOpen] = useState(false)

  async function add() {
    setError(null)
    try {
      await createSchedule.mutateAsync({
        title,
        date,
        time,
        description: description || null,
        isMeeting,
      })
      setTitle("")
      setDate("")
      setTime("")
      setDescription("")
      setIsMeeting(false)
      setAdding(false)
    } catch (e) {
      setError(e instanceof ApiFetchError ? errorMessage(e) : "일정 추가에 실패했습니다.")
    }
  }

  function remove(scheduleId: number) {
    deleteSchedule.mutate(scheduleId, {
      onError: () => setError("일정 삭제에 실패했습니다."),
    })
  }

  const next = schedules ? findNextMeeting(schedules) : null
  // 지난 일정이 "예정 일정"에 섞여 보이던 문제 → 현재 시각 기준으로 분리해 표시.
  const { upcoming, past } = schedules
    ? splitSchedules(schedules)
    : { upcoming: [], past: [] }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">다음 회의 일정</p>
        {next ? (
          <p className="mt-1 text-lg font-semibold">
            {next.title} · {next.date} {next.time}
          </p>
        ) : (
          <p className="mt-1 text-lg font-semibold">예정된 회의가 없습니다.</p>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">예정 일정</h2>
          {isLeader && (
            <Button size="sm" variant="outline" onClick={() => setAdding((v) => !v)}>
              {adding ? "취소" : "+ 일정 추가"}
            </Button>
          )}
        </div>

        {adding && (
          <div className="mb-4 flex flex-col gap-2 rounded-lg border border-border p-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="일정 제목"
              className="h-9 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <div className="flex gap-2">
              <Popover open={dateOpen} onOpenChange={setDateOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex h-9 flex-1 items-center gap-2 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Calendar className="size-4 shrink-0 text-muted-foreground" />
                    <span className={cn(!date && "text-muted-foreground")}>
                      {date || "날짜 선택"}
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start">
                  <Calendars
                    selected={date ? new Date(`${date}T00:00:00`) : undefined}
                    onSelect={(d) => {
                      if (d) setDate(format(d, "yyyy-MM-dd"))
                      setDateOpen(false)
                    }}
                  />
                </PopoverContent>
              </Popover>
              <TimePicker value={time} onChange={setTime} className="flex-1" />
            </div>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="설명 (선택)"
              className="h-9 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={isMeeting}
                onChange={(e) => setIsMeeting(e.target.checked)}
              />
              화상 회의 일정
            </label>
            <div className="flex justify-end">
              <Button size="sm" onClick={add}>
                등록
              </Button>
            </div>
          </div>
        )}

        {error && <p className="mb-2 text-xs text-destructive">{error}</p>}

        {isError ? (
          <p className="text-sm text-muted-foreground">일정을 불러오지 못했습니다.</p>
        ) : !schedules ? (
          <p className="text-sm text-muted-foreground">불러오는 중...</p>
        ) : upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">예정된 일정이 없습니다.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {upcoming.map((schedule) => (
              <ScheduleItem
                key={schedule.id}
                schedule={schedule}
                isLeader={isLeader}
                onRemove={remove}
              />
            ))}
          </ul>
        )}
      </div>

      {past.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <button
            type="button"
            onClick={() => setPastOpen((v) => !v)}
            className="flex w-full items-center justify-between"
            aria-expanded={pastOpen}
          >
            <h2 className="text-base font-semibold text-muted-foreground">
              지난 일정 <span className="text-sm font-normal">{past.length}</span>
            </h2>
            <ChevronDown
              className={cn(
                "size-4 text-muted-foreground transition-transform",
                pastOpen && "rotate-180",
              )}
            />
          </button>

          {pastOpen && (
            <ul className="mt-3 flex flex-col gap-2">
              {past.map((schedule) => (
                <ScheduleItem
                  key={schedule.id}
                  schedule={schedule}
                  isLeader={isLeader}
                  onRemove={remove}
                  muted
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

type ScheduleItemProps = {
  schedule: Schedule
  isLeader: boolean
  onRemove: (scheduleId: number) => void
  muted?: boolean
}

function ScheduleItem({ schedule, isLeader, onRemove, muted }: ScheduleItemProps) {
  return (
    <li
      className={cn(
        "flex items-start justify-between gap-2 rounded-lg border border-border p-3",
        muted && "bg-muted/30",
      )}
    >
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <p className="min-w-0 truncate text-sm font-medium">{schedule.title}</p>
          {schedule.isMeeting && (
            <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-xs">화상 회의</span>
          )}
        </div>
        <p className="mt-1 break-words text-xs text-muted-foreground">
          {schedule.date} {schedule.time}
          {schedule.description ? ` · ${schedule.description}` : ""}
        </p>
      </div>
      {isLeader && (
        <button
          type="button"
          onClick={() => onRemove(schedule.id)}
          className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
          aria-label="삭제"
        >
          <Trash2 className="size-4" />
        </button>
      )}
    </li>
  )
}
