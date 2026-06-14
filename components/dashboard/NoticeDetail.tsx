"use client"

import { useState } from "react"
import { ArrowLeft, Pencil, Trash2 } from "lucide-react"

import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import { Button } from "@/components/ui/button"
import {
  useDeleteNotice,
  useNotices,
  useUpdateNotice,
} from "@/hooks/dashboard/use-notices"
import { ApiFetchError } from "@/lib/api/api-fetch"
import { errorMessage } from "@/lib/api/error"
import { formatMeetingDate } from "@/lib/date"

type NoticeDetailProps = {
  meetingId: number
  noticeId: number
  isLeader: boolean
  onBack: () => void
}

export function NoticeDetail({
  meetingId,
  noticeId,
  isLeader,
  onBack,
}: NoticeDetailProps) {
  const { data: notices } = useNotices(meetingId)
  const updateNotice = useUpdateNotice(meetingId)
  const deleteNotice = useDeleteNotice(meetingId)
  // 단건 조회 API가 없어 목록 캐시에서 찾는다.
  const notice = notices?.find((n) => n.id === noticeId) ?? null

  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const canSave = title.trim() !== "" && content.trim() !== ""

  function startEdit() {
    if (!notice) return
    setTitle(notice.title)
    setContent(notice.content)
    setError(null)
    setEditing(true)
  }

  async function save() {
    setError(null)
    try {
      await updateNotice.mutateAsync({ noticeId, input: { title, content } })
      setEditing(false)
    } catch (e) {
      setError(e instanceof ApiFetchError ? errorMessage(e) : "공지 수정에 실패했습니다.")
    }
  }

  function confirmRemove() {
    deleteNotice.mutate(noticeId, {
      onSuccess: () => onBack(),
      onError: () => setDeleteError("공지 삭제에 실패했습니다."),
    })
  }

  // 삭제되어 목록에서 사라진 경우 등.
  if (!notice) {
    return (
      <div className="flex flex-col gap-4">
        <BackButton onBack={onBack} />
        <p className="text-sm text-muted-foreground">공지를 찾을 수 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <BackButton onBack={onBack} />
        {isLeader && !editing && (
          <div className="flex items-center gap-1">
            <Button size="xs" variant="ghost" onClick={startEdit}>
              <Pencil /> 수정
            </Button>
            <Button size="xs" variant="ghost" onClick={() => setConfirming(true)}>
              <Trash2 /> 삭제
            </Button>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        {editing ? (
          <div className="flex flex-col gap-3">
            <input
              value={title}
              maxLength={50}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목 (최대 50자)"
              className="h-10 rounded-md border bg-background px-3 text-base font-semibold outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <textarea
              value={content}
              maxLength={500}
              onChange={(e) => setContent(e.target.value)}
              placeholder="내용 (최대 500자)"
              rows={8}
              className="rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {!canSave && (
              <p className="text-xs text-muted-foreground">
                {!title.trim() ? "제목을 입력해주세요." : "내용을 입력해주세요."}
              </p>
            )}
            {error && <p className="text-xs text-destructive">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditing(false)}
                disabled={updateNotice.isPending}
              >
                취소
              </Button>
              <Button
                size="sm"
                onClick={save}
                disabled={!canSave || updateNotice.isPending}
              >
                {updateNotice.isPending ? "저장 중..." : "저장"}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <h2 className="break-words text-xl font-semibold">{notice.title}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              작성 {formatMeetingDate(notice.createdAt.slice(0, 10))}
              {notice.updatedAt !== notice.createdAt &&
                ` · 수정 ${formatMeetingDate(notice.updatedAt.slice(0, 10))}`}
            </p>
            <p className="mt-4 whitespace-pre-wrap break-words text-sm">
              {notice.content}
            </p>
          </>
        )}
      </div>

      <ConfirmDialog
        open={confirming}
        onOpenChange={(open) => {
          if (!open) {
            setConfirming(false)
            setDeleteError(null)
          }
        }}
        title="공지 삭제"
        description={`'${notice.title}' 공지를 삭제하시겠어요? 삭제하면 되돌릴 수 없습니다.`}
        loading={deleteNotice.isPending}
        error={deleteError}
        onConfirm={confirmRemove}
      />
    </div>
  )
}

function BackButton({ onBack }: { onBack: () => void }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="size-4" /> 목록으로
    </button>
  )
}
