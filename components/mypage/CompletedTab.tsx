"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { fetchMyMeetings, type Meeting } from "@/lib/api/mypage"

import { EmptyOrError } from "./EmptyOrError"
import { MeetingCard } from "./MeetingCard"

export function CompletedTab() {
  const router = useRouter()
  const [meetings, setMeetings] = useState<Meeting[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMyMeetings("completed")
      .then((res) => setMeetings(res.meetings))
      .catch(() => setError("모임을 불러오지 못했습니다."))
  }, [])

  if (error) return <EmptyOrError message={error} />
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
