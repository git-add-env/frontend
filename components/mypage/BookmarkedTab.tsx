"use client"

import { BookMarkBtn } from "@/components/common/BookMarkBtn"
import { useMyBookmarks, useDeleteBookmark } from "@/hooks/mypage/use-bookmarks"

import { EmptyOrError } from "./EmptyOrError"
import { MeetingCard } from "./MeetingCard"
import { MeetingCardSkeletonGrid } from "./MeetingCardSkeleton"

export function BookmarkedTab() {
  const { data: bookmarks, isError, isPending } = useMyBookmarks()
  const deleteBookmark = useDeleteBookmark()

  if (isError) return <EmptyOrError message="찜한 모임을 불러오지 못했습니다." />
  if (isPending || !bookmarks)
    return <MeetingCardSkeletonGrid className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" />
  if (bookmarks.length === 0)
    return <EmptyOrError message="찜한 모임이 없습니다." />

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {bookmarks.map((bookmark) => (
        // 북마크 응답이 곧 Meeting(+id)이라 그대로 넘긴다(썸네일·상태·모임장 등 실데이터).
        // showDeadline: 찜 탭은 활동중에도 마감일을 보여주고, 완료는 ✓완료로 표시(상태 왜곡 없음).
        <MeetingCard
          key={bookmark.id}
          meeting={bookmark}
          href={`/meetings/${bookmark.meetingId}`}
          showDeadline
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
