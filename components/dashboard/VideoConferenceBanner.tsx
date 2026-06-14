"use client"

import { useState } from "react"
import { Video } from "lucide-react"

import { useJoinMeeting, useStartMeeting } from "@/hooks/dashboard/use-meeting-room"
import { useSchedules } from "@/hooks/dashboard/use-schedules"
import { ApiFetchError } from "@/lib/api/api-fetch"
import { formatMeetingDate } from "@/lib/date"
import { findNextMeeting } from "@/lib/schedule"

import { VideoConference } from "./VideoConference"

type VideoConferenceBannerProps = {
  meetingId: number
  isLeader: boolean
  status: string
}

// 탭과 무관하게 대시보드 상단에 고정되는 화상 회의 진입 배너.
export function VideoConferenceBanner({
  meetingId,
  isLeader,
  status,
}: VideoConferenceBannerProps) {
  const startMeeting = useStartMeeting(meetingId)
  const joinMeeting = useJoinMeeting(meetingId)
  const meetingBusy = startMeeting.isPending || joinMeeting.isPending
  const [meetingError, setMeetingError] = useState<string | null>(null)

  // 화상 회의로 표시된(isMeeting) 일정 중 가장 가까운 미래 회의를 배너에 안내한다.
  const { data: schedules } = useSchedules(meetingId)
  const nextMeeting = schedules ? findNextMeeting(schedules) : null

  async function onMeeting() {
    setMeetingError(null)
    try {
      if (isLeader) {
        await startMeeting.mutateAsync()
      } else {
        await joinMeeting.mutateAsync()
      }
    } catch (e) {
      if (e instanceof ApiFetchError && e.status === 404) {
        setMeetingError("진행 중인 회의가 없습니다.")
      } else if (e instanceof ApiFetchError && e.status === 409) {
        setMeetingError("이미 진행 중인 회의가 있습니다.")
      } else {
        setMeetingError("회의 연결에 실패했습니다.")
      }
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-accent">
            <Video className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">
              {nextMeeting ? "다음 화상 회의" : "화상 회의"}
            </p>
            {nextMeeting ? (
              <>
                <p className="truncate text-base font-semibold">
                  {nextMeeting.title}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {formatMeetingDate(nextMeeting.date)} {nextMeeting.time}
                </p>
              </>
            ) : (
              <p className="text-base font-semibold">
                {isLeader
                  ? "지금 회의를 시작해보세요"
                  : "진행 중인 회의에 참여하세요"}
              </p>
            )}
          </div>
        </div>
        <VideoConference
          status={status}
          isLeader={isLeader}
          busy={meetingBusy}
          onClick={onMeeting}
        />
      </div>
      {meetingError && (
        <p className="mt-3 rounded-md border border-destructive/40 bg-destructive/5 p-2 text-xs text-destructive">
          {meetingError}
        </p>
      )}
    </div>
  )
}
