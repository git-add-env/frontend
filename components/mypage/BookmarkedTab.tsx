"use client"

import { useRouter } from "next/navigation"

import { BookMarkBtn } from "@/components/common/BookMarkBtn"
import { useMyBookmarks, useDeleteBookmark } from "@/hooks/mypage/use-bookmarks"

import { EmptyOrError, FindMeetingsButton } from "./EmptyOrError"
import { MeetingCard } from "./MeetingCard"
import { MeetingCardSkeletonGrid } from "./MeetingCardSkeleton"

export function BookmarkedTab() {
  const router = useRouter()
  const { data: bookmarks, isError, isPending } = useMyBookmarks()
  const deleteBookmark = useDeleteBookmark()

  if (isError) return <EmptyOrError message="찜한 모임을 불러오지 못했습니다." />
  if (isPending || !bookmarks)
    return <MeetingCardSkeletonGrid className="grid gap-3 sm:grid-cols-2" />
  if (bookmarks.length === 0)
    return <EmptyOrError message="찜한 모임이 없습니다." action={<FindMeetingsButton />} />

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {bookmarks.map((bookmark) => (
        // 북마크 응답이 곧 Meeting(+id)이라 MeetingCard에 그대로 넘긴다(썸네일/모임장 등 실데이터).
        // 단 status는 RECRUITING으로 고정 — 찜 탭은 상태와 무관하게 항상 마감일을 보여준다.
        // (실제 status가 ACTIVE/COMPLETED면 MeetingCard가 마감 카운트다운을 숨겨버림)
        <MeetingCard
          key={bookmark.id}
          meeting={{ ...bookmark, status: "RECRUITING" }}
          onClick={() => router.push(`/meetings/${bookmark.meetingId}`)}
          // 찜 버튼은 카드 상단(우상단)에 배치. 이미 찜한 목록이라 채워진 상태, 클릭 시 해제.
          headerAction={
            <BookMarkBtn
              bookmarked
              onToggle={() => deleteBookmark.mutate(bookmark.meetingId)}
              className="size-8"
            />
          }
        />
      ))}
    </div>
  )
}
