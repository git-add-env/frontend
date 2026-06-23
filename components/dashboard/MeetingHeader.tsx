"use client"

import { useState } from "react"

import { Power } from "lucide-react"

import { Button } from "@/components/ui/button"
import { CategoryBadge, HostBadge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CATEGORY_LABEL } from "@/constants/category"
import { useCompleteMeeting } from "@/hooks/mypage/use-my-meetings"
import { ApiFetchError } from "@/lib/api/api-fetch"
import { errorMessage } from "@/lib/api/error"
import type { Meeting } from "@/lib/api/mypage"
import { notify } from "@/lib/notify"

type MeetingHeaderProps = {
  group: Meeting | null
}

// 선택한 모임의 제목 + 카테고리/상태/모임장 배지.
// 모임장이 활동중 모임을 보고 있으면 제목 우측에 종료 버튼을 노출한다(완료 처리는 대시보드에서).
export function MeetingHeader({ group }: MeetingHeaderProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmError, setConfirmError] = useState<string | null>(null)
  const completeMeeting = useCompleteMeeting()

  // 모임장 + 활동중일 때만 종료 가능.
  const canComplete = !!group && group.isLeader && group.status === "ACTIVE"

  async function runComplete() {
    if (!group) return
    setConfirmError(null)
    try {
      await completeMeeting.mutateAsync(group.meetingId)
      setConfirmOpen(false)
      notify.success("모임을 종료했습니다.")
    } catch (e) {
      setConfirmError(
        e instanceof ApiFetchError ? errorMessage(e) : "요청에 실패했습니다.",
      )
    }
  }

  return (
    <div>
      {group && (
        <div className="mb-2 flex items-center gap-2">
          <CategoryBadge
            category={CATEGORY_LABEL[group.category] ?? group.category}
          />
          {group.isLeader && (
            <HostBadge className="border-2 font-bold [&>svg]:stroke-[2.5]" />
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-normal">
          {group?.title ?? "모임을 선택해주세요"}
        </h1>
        {canComplete && (
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setConfirmOpen(true)}
          >
            <Power />
            모임 종료하기
          </Button>
        )}
      </div>

      <Dialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmOpen(false)
            setConfirmError(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>모임 종료</DialogTitle>
            <DialogDescription>
              {`'${group?.title ?? ""}' 모임을 종료하시겠어요? 완료된 모임으로 이동하며 멤버에게 종료 알림이 전송됩니다.`}
            </DialogDescription>
          </DialogHeader>
          {confirmError && (
            <p className="rounded-md border border-destructive/40 bg-destructive/5 p-2 text-xs text-destructive">
              {confirmError}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setConfirmOpen(false)
                setConfirmError(null)
              }}
              disabled={completeMeeting.isPending}
            >
              닫기
            </Button>
            <Button
              variant="destructive"
              onClick={runComplete}
              disabled={completeMeeting.isPending}
            >
              {completeMeeting.isPending ? "처리 중..." : "종료"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
