"use client"

import { useState } from "react"
import { Video } from "lucide-react"

import { useJoinMeeting, useStartMeeting } from "@/hooks/dashboard/use-meeting-room"
import { ApiFetchError } from "@/lib/api/api-fetch"

import { NextMeetingCard } from "./NextMeetingCard"
import { NoticeCard } from "./NoticeCard"
import { ResourceCard } from "./ResourceCard"
import { VideoConference } from "./VideoConference"

type OverviewTabProps = {
  meetingId: number
  isLeader: boolean
  status: string
}

export function OverviewTab({ meetingId, isLeader, status }: OverviewTabProps) {
  const startMeeting = useStartMeeting(meetingId)
  const joinMeeting = useJoinMeeting(meetingId)
  const meetingBusy = startMeeting.isPending || joinMeeting.isPending
  const [meetingError, setMeetingError] = useState<string | null>(null)

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
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-accent">
              <Video className="size-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">화상 회의</p>
              <p className="text-base font-semibold">
                {isLeader ? "지금 회의를 시작해보세요" : "진행 중인 회의에 참여하세요"}
              </p>
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

      <div className="grid gap-4 md:grid-cols-5">
        <div className="md:col-span-3">
          <NoticeCard meetingId={meetingId} isLeader={isLeader} />
        </div>
        <div className="md:col-span-2">
          <NextMeetingCard meetingId={meetingId} />
        </div>
      </div>

      <ResourceCard meetingId={meetingId} isLeader={isLeader} />
    </div>
  )
}
