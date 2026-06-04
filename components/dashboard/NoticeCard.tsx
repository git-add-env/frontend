"use client"

import { useEffect, useState } from "react"
import { ChevronRight, Megaphone, SquarePen, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ApiFetchError } from "@/lib/api/api-fetch"
import { createNotice, deleteNotice, fetchNotices, type Notice } from "@/lib/api/dashboard"
import { errorMessage } from "@/lib/api/error"

type NoticeCardProps = {
  gatheringId: number
  isOwner: boolean
}

export function NoticeCard({ gatheringId, isOwner }: NoticeCardProps) {
  const [notices, setNotices] = useState<Notice[] | null>(null)
  const [adding, setAdding] = useState(false)
  const [viewAll, setViewAll] = useState(false)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchNotices(gatheringId)
      .then((res) => setNotices(res.notices))
      .catch(() => setError("공지를 불러오지 못했습니다."))
  }, [gatheringId])

  async function add() {
    setError(null)
    try {
      const created = await createNotice(gatheringId, { title, content })
      setNotices((prev) => [created, ...(prev ?? [])])
      setTitle("")
      setContent("")
      setAdding(false)
    } catch (e) {
      setError(e instanceof ApiFetchError ? errorMessage(e) : "공지 작성에 실패했습니다.")
    }
  }

  async function remove(noticeId: number) {
    try {
      await deleteNotice(gatheringId, noticeId)
      setNotices((prev) => prev?.filter((n) => n.id !== noticeId) ?? null)
    } catch {
      setError("공지 삭제에 실패했습니다.")
    }
  }

  return (
    <div className="h-full rounded-2xl border border-border bg-card p-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold">공지사항</h2>
        <div className="flex items-center gap-1">
          <Button size="xs" variant="ghost" onClick={() => setViewAll(true)}>
            더보기 <ChevronRight />
          </Button>
          {isOwner && (
            <Button size="xs" variant="ghost" onClick={() => setAdding(true)}>
              <SquarePen /> 작성
            </Button>
          )}
        </div>
      </div>

      {isOwner && (
        <Dialog open={adding} onOpenChange={setAdding}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>작성</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              <input
                value={title}
                maxLength={50}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="제목 (최대 50자)"
                className="h-9 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <textarea
                value={content}
                maxLength={500}
                onChange={(e) => setContent(e.target.value)}
                placeholder="내용 (최대 500자)"
                rows={4}
                className="rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => setAdding(false)}>
                  취소
                </Button>
                <Button size="sm" onClick={add}>
                  등록
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {error && !adding && (
        <p className="mb-2 text-xs text-destructive">{error}</p>
      )}

      {/* 공지 2개 이하여도 3개일 때 높이를 유지하도록 최소 높이 확보 (공지 1개 ≈ 66px, gap 포함 3개 ≈ 14rem) */}
      <div className="min-h-[14rem]">
        {!notices ? (
          <p className="text-sm text-muted-foreground">불러오는 중...</p>
        ) : notices.length === 0 ? (
          <p className="text-sm text-muted-foreground">등록된 공지사항이 없습니다.</p>
        ) : (
          <ul className="flex min-h-[14rem] flex-col gap-3">
            {notices.slice(0, 3).map((notice) => (
              <li key={notice.id} className="rounded-lg border border-border p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium">{notice.title}</p>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => remove(notice.id)}
                      className="text-muted-foreground transition-colors hover:text-destructive"
                      aria-label="삭제"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
                <p className="mt-1 whitespace-pre-wrap text-xs text-muted-foreground">
                  {notice.content}
                </p>
              </li>
            ))}
            {/* 공지가 3개 미만이면 남는 자리를 빈 칸으로 채워 항상 3칸 높이를 유지 */}
            {Array.from({ length: Math.max(0, 3 - notices.length) }).map((_, i) => (
              <li
                key={`placeholder-${i}`}
                aria-hidden
                className="flex min-h-[3.25rem] flex-1 items-center justify-center rounded-lg border border-dashed border-border/60"
              >
                <Megaphone className="size-5 text-muted-foreground/30" />
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 더보기: 공지사항 전체 보기 모달 */}
      <Dialog open={viewAll} onOpenChange={setViewAll}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>공지사항 전체</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            {!notices || notices.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                등록된 공지사항이 없습니다.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {notices.map((notice) => (
                  <li
                    key={notice.id}
                    className="rounded-lg border border-border p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">{notice.title}</p>
                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => remove(notice.id)}
                          className="text-muted-foreground transition-colors hover:text-destructive"
                          aria-label="삭제"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-xs text-muted-foreground">
                      {notice.content}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
