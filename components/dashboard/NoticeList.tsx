"use client"

import { useState } from "react"
import { Megaphone, SquarePen } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useCreateNotice, useNotices } from "@/hooks/dashboard/use-notices"
import { ApiFetchError } from "@/lib/api/api-fetch"
import { errorMessage } from "@/lib/api/error"
import { formatMeetingDate } from "@/lib/date"

import { EmptyState, ListSkeleton } from "./DashboardStates"

type NoticeListProps = {
  meetingId: number
  isLeader: boolean
  onSelect: (noticeId: number) => void
}

export function NoticeList({ meetingId, isLeader, onSelect }: NoticeListProps) {
  const { data: notices, isError } = useNotices(meetingId)
  const createNotice = useCreateNotice(meetingId)
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [error, setError] = useState<string | null>(null)

  const canSubmit = title.trim() !== "" && content.trim() !== ""

  // 다이얼로그를 닫을 때(취소·X·바깥·ESC) 입력값과 에러를 초기화한다.
  function changeAdding(open: boolean) {
    setAdding(open)
    if (!open) {
      setTitle("")
      setContent("")
      setError(null)
    }
  }

  async function add() {
    setError(null)
    try {
      await createNotice.mutateAsync({ title, content })
      changeAdding(false)
    } catch (e) {
      setError(e instanceof ApiFetchError ? errorMessage(e) : "공지 작성에 실패했습니다.")
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">공지사항</h2>
        {isLeader && (
          <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
            <SquarePen /> 작성
          </Button>
        )}
      </div>

      {isError ? (
        <p className="text-sm text-muted-foreground">공지를 불러오지 못했습니다.</p>
      ) : !notices ? (
        <ListSkeleton />
      ) : notices.length === 0 ? (
        <EmptyState message="등록된 공지사항이 없습니다." />
      ) : (
        <ul className="flex flex-col gap-2">
          {notices.map((notice) => (
            <li key={notice.id}>
              <button
                type="button"
                onClick={() => onSelect(notice.id)}
                className="flex w-full items-start gap-3 rounded-xl border border-border bg-muted/30 p-4 text-left transition-colors hover:bg-muted/50"
              >
                {/* 공지 아이콘(확성기) */}
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground">
                  <Megaphone className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-sm font-bold text-foreground">{notice.title}</p>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatMeetingDate(notice.createdAt.slice(0, 10))}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {notice.content}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {isLeader && (
        <Dialog open={adding} onOpenChange={changeAdding}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>공지 작성</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              <input
                value={title}
                maxLength={50}
                onChange={(e) => setTitle(e.target.value)}
                aria-label="공지 제목"
                placeholder="제목 (최대 50자)"
                className="h-9 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <textarea
                value={content}
                maxLength={500}
                onChange={(e) => setContent(e.target.value)}
                aria-label="공지 내용"
                placeholder="내용 (최대 500자)"
                rows={5}
                className="rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              {!canSubmit && (
                <p className="text-xs text-muted-foreground">
                  {!title.trim() ? "제목을 입력해주세요." : "내용을 입력해주세요."}
                </p>
              )}
              {error && <p className="text-xs text-destructive">{error}</p>}
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => changeAdding(false)}>
                  취소
                </Button>
                <Button
                  size="sm"
                  onClick={add}
                  disabled={!canSubmit || createNotice.isPending}
                >
                  {createNotice.isPending ? "등록 중..." : "등록"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
