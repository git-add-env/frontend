"use client"

import { format } from "date-fns"
import { useState } from "react"
import { Calendar, CalendarDays, ChevronDown, Plus, Trash2 } from "lucide-react"

import { Calendars } from "@/components/common/Calendars"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
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

import { ListSkeleton } from "./DashboardStates"

// 일정 제목 최대 길이 (백엔드 제약 확정 시 맞춰 조정)
const TITLE_MAX = 30

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
  const [pendingId, setPendingId] = useState<number | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // 입력 폼.
  const [title, setTitle] = useState("")
  const [date, setDate] = useState("")
  const [time, setTime] = useState("")
  const [description, setDescription] = useState("")
  const [isMeeting, setIsMeeting] = useState(false)
  const [dateOpen, setDateOpen] = useState(false)

  // 폼 입력값 초기화 (등록 성공·취소 공용).
  function resetForm() {
    setTitle("")
    setDate("")
    setTime("")
    setDescription("")
    setIsMeeting(false)
    setError(null)
  }

  // 취소: 입력 기록을 비우고 폼을 닫는다.
  function cancelAdd() {
    resetForm()
    setAdding(false)
  }

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
      resetForm()
      setAdding(false)
    } catch (e) {
      setError(e instanceof ApiFetchError ? errorMessage(e) : "일정 추가에 실패했습니다.")
    }
  }

  // 휴지통 클릭 → 확인 다이얼로그를 띄우고, 확인 시 실제 삭제한다.
  function confirmRemove() {
    if (pendingId === null) return
    deleteSchedule.mutate(pendingId, {
      onSuccess: () => setPendingId(null),
      onError: () => setDeleteError("일정 삭제에 실패했습니다."),
    })
  }

  const next = schedules ? findNextMeeting(schedules) : null
  // 지난 일정이 "예정 일정"에 섞여 보이던 문제 → 현재 시각 기준으로 분리해 표시.
  const { upcoming, past } = schedules
    ? splitSchedules(schedules)
    : { upcoming: [], past: [] }
  const pendingTitle = schedules?.find((s) => s.id === pendingId)?.title ?? null
  // 제목·날짜·시간이 모두 채워져야 등록 가능. (설명은 선택)
  const canSubmit = title.trim() !== "" && date !== "" && time !== ""

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">다음 회의 일정</p>
        <div className="mt-2 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <CalendarDays className="size-6" />
            </span>
            <div className="min-w-0">
              {next ? (
                <>
                  <p className="truncate text-base font-bold">{next.title}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {next.date} {next.time}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-base font-bold">예정된 회의가 없어요</p>
                  <p className="text-sm text-muted-foreground">
                    다음 회의를 잡고 멤버에게 알려보세요.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold">예정 일정</h2>
          {isLeader && !adding && (
            <Button
              size="sm"
              variant="outline"
              className="rounded-full"
              onClick={() => setAdding(true)}
            >
              <Plus /> 추가
            </Button>
          )}
        </div>

        {adding && (
          <div className="mb-4 flex flex-col gap-2 rounded-lg border border-border p-3">
            <div>
              <input
                value={title}
                // maxLength는 한글 IME에서 1자 초과될 수 있어 onChange에서 잘라 보강.
                onChange={(e) => setTitle(e.target.value.slice(0, TITLE_MAX))}
                maxLength={TITLE_MAX}
                placeholder="일정 제목"
                className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <div className="mt-1 flex items-center justify-between pr-1 text-xs">
                <span role="alert" className="text-destructive">
                  {!title.trim() ? "일정 제목을 입력해주세요." : ""}
                </span>
                <span className="text-muted-foreground tabular-nums">
                  {title.length}/{TITLE_MAX}
                </span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <Popover open={dateOpen} onOpenChange={setDateOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="flex h-9 w-full items-center gap-2 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                {title.trim() !== "" && !date && (
                  <p role="alert" className="mt-1 text-xs text-destructive">
                    날짜를 선택해주세요.
                  </p>
                )}
              </div>
              <div className="flex-1">
                <TimePicker value={time} onChange={setTime} className="w-full" />
                {title.trim() !== "" && !time && (
                  <p role="alert" className="mt-1 text-xs text-destructive">
                    시간을 선택해주세요.
                  </p>
                )}
              </div>
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
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={cancelAdd}
                disabled={createSchedule.isPending}
              >
                취소
              </Button>
              <Button
                size="sm"
                onClick={add}
                disabled={!canSubmit || createSchedule.isPending}
              >
                {createSchedule.isPending ? "등록 중..." : "등록"}
              </Button>
            </div>
          </div>
        )}

        {error && <p className="mb-2 text-xs text-destructive">{error}</p>}

        {isError ? (
          <p className="text-sm text-muted-foreground">일정을 불러오지 못했습니다.</p>
        ) : !schedules ? (
          <ListSkeleton />
        ) : upcoming.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border p-10 text-center">
            <span className="flex size-12 items-center justify-center rounded-full border border-border bg-card text-muted-foreground">
              <CalendarDays className="size-6" />
            </span>
            <div>
              <p className="text-sm font-bold text-foreground">예정된 일정이 없어요</p>
              <p className="mt-1 text-xs text-muted-foreground">
                회의·마감 등 팀 일정을 추가해보세요.
              </p>
            </div>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {upcoming.map((schedule) => (
              <ScheduleItem
                key={schedule.id}
                schedule={schedule}
                isLeader={isLeader}
                onRemove={setPendingId}
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
                  onRemove={setPendingId}
                  muted
                />
              ))}
            </ul>
          )}
        </div>
      )}

      <ConfirmDialog
        open={pendingId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingId(null)
            setDeleteError(null)
          }
        }}
        title="일정 삭제"
        description={`${pendingTitle ? `'${pendingTitle}' ` : ""}일정을 삭제하시겠어요? 삭제하면 되돌릴 수 없습니다.`}
        loading={deleteSchedule.isPending}
        error={deleteError}
        onConfirm={confirmRemove}
      />
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
        "flex items-center justify-between gap-2 rounded-lg border border-border p-3",
        muted && "bg-muted/30",
      )}
    >
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <p className="min-w-0 truncate text-sm font-bold">{schedule.title}</p>
          {schedule.isMeeting && (
            <span className="shrink-0 rounded-full bg-blue-500 px-2 py-0.5 text-xs font-medium text-white">화상 회의</span>
          )}
        </div>
        {schedule.description && (
          <p className="mt-1 wrap-break-word text-xs text-muted-foreground">
            {schedule.description}
          </p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          {schedule.date} {schedule.time}
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
