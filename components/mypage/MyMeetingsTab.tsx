"use client"

import { useCallback, useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ApiFetchError } from "@/lib/api/api-fetch"
import {
  cancelMembership,
  completeMeeting,
  deleteMeeting,
  fetchMyMeetings,
  type Meeting,
} from "@/lib/api/mypage"
import { errorMessage } from "@/lib/api/error"

import { EmptyOrError } from "./EmptyOrError"
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

export function MyMeetingsTab({ status }: MyMeetingsTabProps) {
  const [meetings, setMeetings] = useState<Meeting[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<ConfirmState>(null)
  const [confirmError, setConfirmError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    fetchMyMeetings(status)
      .then((res) => setMeetings(res.meetings))
      .catch(() => setError("모임을 불러오지 못했습니다."))
  }, [status])

  useEffect(() => {
    load()
  }, [load])

  async function runConfirm() {
    if (!confirm) return
    setBusy(true)
    setConfirmError(null)
    try {
      if (confirm.action === "cancel") {
        await cancelMembership(confirm.meetingId)
      } else if (confirm.action === "complete") {
        await completeMeeting(confirm.meetingId)
      } else {
        await deleteMeeting(confirm.meetingId)
      }
      setConfirm(null)
      load()
    } catch (e) {
      setConfirmError(
        e instanceof ApiFetchError ? errorMessage(e) : "요청에 실패했습니다.",
      )
    } finally {
      setBusy(false)
    }
  }

  if (error) return <EmptyOrError message={error} />
  if (!meetings) return <EmptyOrError message="로딩 중..." />
  if (meetings.length === 0)
    return (
      <EmptyOrError
        message={
          status === "recruiting" ? "모집중인 모임이 없습니다." : "활동중인 모임이 없습니다."
        }
      />
    )

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        {meetings.map((meeting) => {
          return (
            <MeetingCard
              key={meeting.meetingId}
              meeting={meeting}
              footer={
                <div className="mt-3 flex flex-wrap justify-end gap-2">
                  {meeting.isLeader ? (
                    <>
                      {/* 모집중: 삭제 / 활동중: 종료. 완료된 모임엔 모임장 액션 없음. */}
                      {meeting.status === "RECRUITING" && (
                        // TODO(MVP): 모임 정보 수정 페이지(/meetings/[id]/edit) 미구현으로 404 발생 → 임시 비활성화
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            setConfirm({
                              meetingId: meeting.meetingId,
                              title: meeting.title,
                              action: "delete",
                            })
                          }
                        >
                          삭제
                        </Button>
                      )}
                      {meeting.status === "ACTIVE" && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() =>
                            setConfirm({
                              meetingId: meeting.meetingId,
                              title: meeting.title,
                              action: "complete",
                            })
                          }
                        >
                          종료
                        </Button>
                      )}
                    </>
                  ) : (
                    meeting.status === "RECRUITING" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setConfirm({
                            meetingId: meeting.meetingId,
                            title: meeting.title,
                            action: "cancel",
                          })
                        }
                      >
                        참여 취소
                      </Button>
                    )
                  )}
                </div>
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
