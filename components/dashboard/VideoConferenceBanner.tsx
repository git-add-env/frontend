"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Video } from "lucide-react"

import { useConferenceStatus } from "@/hooks/dashboard/use-conference-status"
import {
  useJoinMeeting,
  useStartMeeting,
} from "@/hooks/dashboard/use-meeting-room"
import { useSchedules } from "@/hooks/dashboard/use-schedules"
import { ApiFetchError } from "@/lib/api/api-fetch"
import type { MeetingRoom } from "@/lib/api/dashboard"
import { formatMeetingDate } from "@/lib/date"
import { findNextMeeting } from "@/lib/schedule"
import { useAuthStore } from "@/stores/auth-store"
import { useConferenceStore } from "@/stores/conference-store"

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
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const activeConference = useConferenceStore((state) => state.activeConference)
  const canEnterConference = useConferenceStore(
    (state) => state.canEnterConference
  )
  const setConnection = useConferenceStore((state) => state.setConnection)
  const startMeeting = useStartMeeting(meetingId)
  const joinMeeting = useJoinMeeting(meetingId)
  const meetingBusy = startMeeting.isPending || joinMeeting.isPending
  const [meetingError, setMeetingError] = useState<string | null>(null)

  // 활동중일 때만 회의 진행 상태를 조회한다. 멤버는 isActive로 참여 가능 여부가 갈리고,
  // 모임장도 진행 중이면 버튼 문구가 '시작하기'→'참여하기'로 바뀐다.
  const { data: conference } = useConferenceStatus(
    meetingId,
    status === "ACTIVE"
  )

  // 화상 회의로 표시된(isMeeting) 일정 중 가장 가까운 미래 회의를 배너에 안내한다.
  const { data: schedules } = useSchedules(meetingId)
  const nextMeeting = schedules ? findNextMeeting(schedules) : null
  const isBlockedByOtherConference =
    activeConference?.userId === String(user?.id) &&
    activeConference.meetingId !== meetingId

  async function onMeeting() {
    setMeetingError(null)

    if (!user) {
      setMeetingError("로그인 정보를 확인한 뒤 다시 시도해주세요.")
      return
    }

    const userId = String(user.id)

    await useConferenceStore.persist.rehydrate()

    if (!canEnterConference(meetingId, userId)) {
      setMeetingError(
        "이미 다른 화상회의에 참여 중입니다. 기존 회의에서 먼저 나가주세요."
      )
      return
    }

    try {
      let room: MeetingRoom

      if (isLeader && !conference?.isActive) {
        try {
          room = await startMeeting.mutateAsync()
        } catch (error) {
          if (!(error instanceof ApiFetchError) || error.status !== 409) {
            throw error
          }

          room = await joinMeeting.mutateAsync()
        }
      } else {
        room = await joinMeeting.mutateAsync()
      }

      if (!setConnection(meetingId, userId, room)) {
        setMeetingError(
          "이미 다른 화상회의에 참여 중입니다. 기존 회의에서 먼저 나가주세요."
        )
        return
      }

      router.push(`/meetings/${meetingId}/conference`)
    } catch (e) {
      if (e instanceof ApiFetchError && e.status === 404) {
        setMeetingError("진행 중인 회의가 없습니다.")
      } else if (e instanceof ApiFetchError && e.status === 409) {
        setMeetingError("이미 다른 화상회의에 참여 중입니다.")
      } else {
        setMeetingError("회의 연결에 실패했습니다.")
      }
    }
  }

  return (
    <div className="flex min-h-28 flex-col justify-center rounded-2xl border border-blue-100 bg-blue-50 p-6 shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-white text-blue-500">
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
          meetingActive={conference?.isActive ?? false}
          busy={meetingBusy}
          blocked={isBlockedByOtherConference}
          onClick={onMeeting}
        />
      </div>
      {isBlockedByOtherConference && (
        <p className="mt-3 text-xs text-muted-foreground">
          다른 화상회의에 참여 중이어서 이 회의에는 입장할 수 없습니다.
        </p>
      )}
      {meetingError && (
        <p className="mt-3 rounded-md border border-destructive/40 bg-destructive/5 p-2 text-xs text-destructive">
          {meetingError}
        </p>
      )}
    </div>
  )
}
