"use client"

import { useState } from "react"
import { ChevronRight, SquarePen } from "lucide-react"

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
    <div className="flex flex-col gap-4">
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
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      ) : notices.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          등록된 공지사항이 없습니다.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {notices.map((notice) => (
            <li key={notice.id}>
              <button
                type="button"
                onClick={() => onSelect(notice.id)}
                className="flex w-full items-center gap-3 rounded-lg border border-border p-4 text-left transition-colors hover:bg-accent/40"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{notice.title}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {notice.content}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatMeetingDate(notice.createdAt.slice(0, 10))}
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
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
