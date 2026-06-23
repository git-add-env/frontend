"use client"

import { useState } from "react"

import { NoticeDetail } from "./NoticeDetail"
import { NoticeList } from "./NoticeList"

type NoticesTabProps = {
  meetingId: number
  isLeader: boolean
}

// 공지 탭: 목록 ⇄ 상세를 드릴다운으로 전환한다. (selectedId가 있으면 상세)
export function NoticesTab({ meetingId, isLeader }: NoticesTabProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null)

  if (selectedId !== null) {
    return (
      <NoticeDetail
        meetingId={meetingId}
        noticeId={selectedId}
        isLeader={isLeader}
        onBack={() => setSelectedId(null)}
      />
    )
  }

  return (
    <NoticeList
      meetingId={meetingId}
      isLeader={isLeader}
      onSelect={setSelectedId}
    />
  )
}
