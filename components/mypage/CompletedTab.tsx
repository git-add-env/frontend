"use client"

import { useRouter } from "next/navigation"

import { useMyMeetings } from "@/hooks/mypage/use-my-meetings"

import { EmptyOrError } from "./EmptyOrError"
import { MeetingCard } from "./MeetingCard"

export function CompletedTab() {
  const router = useRouter()
  const { data: meetings, isError } = useMyMeetings("completed")

  if (isError) return <EmptyOrError message="모임을 불러오지 못했습니다." />
  if (!meetings) return <EmptyOrError message="로딩 중..." />
  if (meetings.length === 0) return <EmptyOrError message="완료된 모임이 없습니다." />

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {meetings.map((meeting) => (
        <MeetingCard
          key={meeting.meetingId}
          meeting={meeting}
          onClick={() => router.push(`/meetings/${meeting.meetingId}`)}
        />
      ))}
    </div>
  )
}
