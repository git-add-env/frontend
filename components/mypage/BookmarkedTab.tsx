"use client"

import { useMyBookmarks, useDeleteBookmark } from "@/hooks/mypage/use-bookmarks"

import { BookmarkCard } from "./BookmarkCard"
import { EmptyOrError } from "./EmptyOrError"

export function BookmarkedTab() {
  const { data: bookmarks, isError } = useMyBookmarks()
  const deleteBookmark = useDeleteBookmark()

  function unbookmark(meetingId: number) {
    deleteBookmark.mutate(meetingId)
  }

  if (isError) return <EmptyOrError message="찜한 모임을 불러오지 못했습니다." />
  if (!bookmarks) return <EmptyOrError message="로딩 중..." />
  if (bookmarks.length === 0) return <EmptyOrError message="찜한 모임이 없습니다." />

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {bookmarks.map((b) => (
        <BookmarkCard key={b.id} bookmark={b} onRemove={() => unbookmark(b.meetingId)} />
      ))}
    </div>
  )
}
