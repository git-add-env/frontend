"use client"

import { useCallback, useEffect, useState } from "react"

import { deleteBookmark, fetchMyBookmarks, type Bookmark } from "@/lib/api/mypage"

import { BookmarkCard } from "./BookmarkCard"
import { EmptyOrError } from "./EmptyOrError"

export function BookmarkedTab() {
  const [bookmarks, setBookmarks] = useState<Bookmark[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    fetchMyBookmarks()
      .then((res) => setBookmarks(res.bookmarks))
      .catch(() => setError("찜한 모임을 불러오지 못했습니다."))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function unbookmark(meetingId: number) {
    try {
      await deleteBookmark(meetingId)
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "찜 해제에 실패했습니다.")
    }
  }

  if (error) return <EmptyOrError message={error} />
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
