"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  useCancelMembership,
  useCompleteMeeting,
  useDeleteMeeting,
  useMyMeetings,
} from "@/hooks/mypage/use-my-meetings"
import { ApiFetchError } from "@/lib/api/api-fetch"
import { errorMessage } from "@/lib/api/error"

import { EmptyOrError, FindMeetingsButton } from "./EmptyOrError"
import { MeetingCardSkeletonGrid } from "./MeetingCardSkeleton"
import { MeetingCard } from "./MeetingCard"

type ConfirmAction = "cancel" | "delete" | "complete"

type ConfirmState = {
  meetingId: number
  title: string
  action: ConfirmAction
} | null

type MyMeetingsTabProps = {
  status: "recruiting" | "active"
}

// ⋯ 드롭다운 안의 액션 항목 — 전체폭 좌측정렬 버튼.
function MenuItem({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-md px-2.5 py-1.5 text-left text-sm transition-colors hover:bg-muted",
        danger ? "text-destructive hover:bg-destructive/10" : "text-foreground",
      )}
    >
      {children}
    </button>
  )
}

export function MyMeetingsTab({ status }: MyMeetingsTabProps) {
  const router = useRouter()
  const { data: meetings, isError, isPending } = useMyMeetings(status)
  const [confirm, setConfirm] = useState<ConfirmState>(null)
  const [confirmError, setConfirmError] = useState<string | null>(null)

  const cancelMembership = useCancelMembership()
  const completeMeeting = useCompleteMeeting()
  const deleteMeeting = useDeleteMeeting()
  const busy = cancelMembership.isPending || completeMeeting.isPending || deleteMeeting.isPending

  async function runConfirm() {
    if (!confirm) return
    setConfirmError(null)
    const mutation =
      confirm.action === "cancel"
        ? cancelMembership
        : confirm.action === "complete"
          ? completeMeeting
          : deleteMeeting
    try {
      await mutation.mutateAsync(confirm.meetingId)
      setConfirm(null)
    } catch (e) {
      setConfirmError(
        e instanceof ApiFetchError ? errorMessage(e) : "요청에 실패했습니다.",
      )
    }
  }

  if (isError) return <EmptyOrError message="모임을 불러오지 못했습니다." />
  if (isPending || !meetings)
    return <MeetingCardSkeletonGrid className="grid gap-3 sm:grid-cols-2" />
  if (meetings.length === 0)
    return (
      <EmptyOrError
        message={
          status === "recruiting" ? "모집중인 모임이 없습니다." : "활동중인 모임이 없습니다."
        }
        action={<FindMeetingsButton />}
      />
    )

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        {meetings.map((meeting) => {
          // 모집중: (모임장)삭제 / (멤버)참여취소, 활동중: (모임장)종료. ⋯ 메뉴에 들어간다.
          let menuItem: React.ReactNode = null
          if (meeting.isLeader && meeting.status === "RECRUITING") {
            menuItem = (
              <MenuItem
                danger
                onClick={() =>
                  setConfirm({ meetingId: meeting.meetingId, title: meeting.title, action: "delete" })
                }
              >
                삭제
              </MenuItem>
            )
          } else if (meeting.isLeader && meeting.status === "ACTIVE") {
            menuItem = (
              <MenuItem
                onClick={() =>
                  setConfirm({ meetingId: meeting.meetingId, title: meeting.title, action: "complete" })
                }
              >
                종료
              </MenuItem>
            )
          } else if (!meeting.isLeader && meeting.status === "RECRUITING") {
            menuItem = (
              <MenuItem
                danger
                onClick={() =>
                  setConfirm({ meetingId: meeting.meetingId, title: meeting.title, action: "cancel" })
                }
              >
                참여 취소
              </MenuItem>
            )
          }

          return (
            <MeetingCard
              key={meeting.meetingId}
              meeting={meeting}
              menu={menuItem}
              // 카드 전체 클릭은 상세 페이지로. "내 모임" 버튼/⋯ 메뉴는 각자 stopPropagation으로 분리됨.
              onClick={() => router.push(`/meetings/${meeting.meetingId}`)}
              action={
                <Button
                  size="sm"
                  onClick={() => router.push(`/dashboard?meetingId=${meeting.meetingId}`)}
                >
                  내 모임
                  <ArrowRight />
                </Button>
              }
            />
          )
        })}
      </div>

      <Dialog
        open={confirm !== null}
        onOpenChange={(open) => {
          if (!open) {
            setConfirm(null)
            setConfirmError(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirm?.action === "delete"
                ? "모임 삭제"
                : confirm?.action === "complete"
                  ? "모임 종료"
                  : "참여 취소"}
            </DialogTitle>
            <DialogDescription>
              {confirm?.action === "delete"
                ? `'${confirm?.title}' 모임을 삭제하시겠어요? 참여 멤버가 있으면 취소 알림이 전송됩니다.`
                : confirm?.action === "complete"
                  ? `'${confirm?.title}' 모임을 종료하시겠어요? 완료된 모임으로 이동하며 멤버에게 종료 알림이 전송됩니다.`
                  : `'${confirm?.title}' 모임 참여를 취소하시겠어요?`}
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
                setConfirm(null)
                setConfirmError(null)
              }}
              disabled={busy}
            >
              닫기
            </Button>
            <Button
              variant={confirm?.action === "delete" ? "destructive" : "default"}
              onClick={runConfirm}
              disabled={busy}
            >
              {busy
                ? "처리 중..."
                : confirm?.action === "delete"
                  ? "삭제"
                  : confirm?.action === "complete"
                    ? "종료"
                    : "참여 취소"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
