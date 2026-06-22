"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import type { LocalUserChoices } from "@livekit/components-core"
import { useQuery } from "@tanstack/react-query"
import {
  LiveKitRoom,
  PreJoin,
  VideoConference as LiveKitVideoConference,
  useConnectionState,
  useParticipants,
} from "@livekit/components-react"
import {
  Loader2,
  LockKeyhole,
  LogOut,
  Mic2,
  PhoneOff,
  Settings2,
  Users,
  Video,
  VideoOff,
  Wifi,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ConfirmDialog } from "@/components/common/ConfirmDialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { queryKeys } from "@/hooks/api/query-keys"
import {
  useEndMeeting,
  useJoinMeeting,
  useLeaveMeeting,
} from "@/hooks/dashboard/use-meeting-room"
import { useAuthUser } from "@/hooks/useAuthUser"
import { ApiFetchError } from "@/lib/api/api-fetch"
import { fetchMeetingDetail } from "@/lib/api/meetings"
import { notify } from "@/lib/notify"
import { useConferenceStore } from "@/stores/conference-store"

type MeetingConferenceRoomProps = {
  meetingId: number | null
}

export function MeetingConferenceRoom({
  meetingId,
}: MeetingConferenceRoomProps) {
  const router = useRouter()
  const { user, status: authStatus, isLoading: isUserLoading } = useAuthUser()
  const connection = useConferenceStore((state) => state.connection)
  const activeConference = useConferenceStore((state) => state.activeConference)
  const canEnterConference = useConferenceStore(
    (state) => state.canEnterConference
  )
  const setConnection = useConferenceStore((state) => state.setConnection)
  const activateConference = useConferenceStore(
    (state) => state.activateConference
  )
  const clearConference = useConferenceStore((state) => state.clearConference)
  const joinMeeting = useJoinMeeting(meetingId ?? 0)
  const endMeeting = useEndMeeting(meetingId ?? 0)
  const leaveMeeting = useLeaveMeeting(meetingId ?? 0)
  const requestedConnection = useRef(false)
  const closingConference = useRef(false)
  const [userChoices, setUserChoices] = useState<LocalUserChoices | null>(null)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [endDialogOpen, setEndDialogOpen] = useState(false)
  const [endError, setEndError] = useState<string | null>(null)

  const currentConnection =
    connection?.meetingId === meetingId ? connection : null
  const userId = user ? String(user.id) : null
  const participantName = user?.nickname ?? user?.name ?? "참가자"
  const { data: meetingDetail } = useQuery({
    queryKey: queryKeys.meetings.conferenceRole(meetingId ?? 0),
    queryFn: () => fetchMeetingDetail(meetingId as number, { auth: true }),
    enabled: meetingId !== null && authStatus === "authenticated",
  })
  const isLeader = meetingDetail?.isLeader ?? false

  useEffect(() => {
    if (
      !meetingId ||
      !userId ||
      currentConnection ||
      requestedConnection.current
    ) {
      return
    }

    const conferenceMeetingId = meetingId
    const conferenceUserId = userId
    requestedConnection.current = true

    async function connect() {
      await useConferenceStore.persist.rehydrate()

      if (!canEnterConference(conferenceMeetingId, conferenceUserId)) {
        setConnectionError("이미 다른 화상회의에 참여 중입니다.")
        return
      }

      try {
        const room = await joinMeeting.mutateAsync()

        if (!setConnection(conferenceMeetingId, conferenceUserId, room)) {
          setConnectionError("이미 다른 화상회의에 참여 중입니다.")
        }
      } catch (error) {
        if (error instanceof ApiFetchError && error.status === 404) {
          setConnectionError("종료되었거나 존재하지 않는 화상회의입니다.")
        } else if (error instanceof ApiFetchError && error.status === 409) {
          setConnectionError("이미 다른 화상회의에 참여 중입니다.")
        } else {
          setConnectionError("화상회의 연결 정보를 가져오지 못했습니다.")
        }
      }
    }

    void connect()
  }, [
    canEnterConference,
    currentConnection,
    joinMeeting,
    meetingId,
    setConnection,
    userId,
  ])

  function returnToDashboard() {
    if (meetingId) clearConference(meetingId)
    router.push(meetingId ? `/dashboard?meetingId=${meetingId}` : "/dashboard")
  }

  async function handleLeave() {
    if (!meetingId) {
      returnToDashboard()
      return
    }

    if (closingConference.current) return

    closingConference.current = true

    try {
      await leaveMeeting.mutateAsync()
    } catch (error) {
      if (!(error instanceof ApiFetchError) || error.status !== 404) {
        notify.warning(
          "퇴장 상태를 서버에 반영하지 못했지만 회의실에서는 나갑니다."
        )
      }
    } finally {
      returnToDashboard()
    }
  }

  async function handleEndMeeting() {
    if (!meetingId || closingConference.current) return

    closingConference.current = true
    setEndError(null)

    try {
      const result = await endMeeting.mutateAsync()
      notify.success(
        result.ended
          ? "화상회의를 종료했습니다."
          : "이미 종료된 화상회의입니다."
      )
      setEndDialogOpen(false)
      returnToDashboard()
    } catch (error) {
      setEndError(
        error instanceof ApiFetchError && error.status === 403
          ? "화상회의를 종료할 권한이 없습니다."
          : "화상회의를 종료하지 못했습니다. 다시 시도해주세요."
      )
      closingConference.current = false
    }
  }

  if (!meetingId) {
    return (
      <ConferenceError
        message="올바르지 않은 모임 주소입니다."
        onBack={handleLeave}
      />
    )
  }

  if (
    isUserLoading ||
    authStatus === "loading" ||
    (user && !currentConnection && !connectionError)
  ) {
    return (
      <section className="flex min-h-[70vh] items-center justify-center bg-muted/30 px-6">
        <div className="flex flex-col items-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-2xl border bg-background shadow-sm">
            <Loader2 className="size-6 animate-spin text-primary" aria-hidden />
          </div>
          <div className="space-y-1 text-center">
            <p className="font-medium">화상회의를 준비하고 있습니다</p>
            <p className="text-sm text-muted-foreground">잠시만 기다려주세요</p>
          </div>
        </div>
      </section>
    )
  }

  if (!user || connectionError || !currentConnection) {
    return (
      <ConferenceError
        message={connectionError ?? "로그인 정보를 확인할 수 없습니다."}
        onBack={handleLeave}
        activeMeetingId={
          activeConference?.userId === userId
            ? activeConference.meetingId
            : null
        }
      />
    )
  }

  if (!userChoices) {
    return (
      <>
        <section className="flex min-h-[calc(100svh-8rem)] flex-col bg-muted/30">
          <ConferenceHeader
            meetingId={meetingId}
            roomName={currentConnection.roomId}
            isLeader={isLeader}
            busy={leaveMeeting.isPending || endMeeting.isPending}
            onLeave={() => void handleLeave()}
            onEnd={() => setEndDialogOpen(true)}
          />
          <div className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-6 px-6 py-10 lg:grid-cols-[0.75fr_1.25fr] lg:px-10">
            <Card className="h-fit border-border/70 shadow-sm">
              <CardHeader className="space-y-3">
                <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Video className="size-5" aria-hidden />
                </div>
                <div className="space-y-1.5">
                  <CardTitle className="text-2xl">
                    참여할 준비가 되셨나요?
                  </CardTitle>
                  <CardDescription className="leading-6">
                    회의에 입장하기 전 카메라와 마이크 상태를 확인해주세요.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2.5">
                  <PreviewGuide icon={Video} text="카메라 화면 확인" />
                  <PreviewGuide icon={Mic2} text="마이크 입력 확인" />
                  <PreviewGuide icon={Settings2} text="사용할 장치 선택" />
                </div>
                <div className="flex items-start gap-3 rounded-xl border bg-muted/50 p-3 text-xs leading-5 text-muted-foreground">
                  <LockKeyhole className="mt-0.5 size-4 shrink-0" aria-hidden />
                  입장 전에는 영상과 음성이 다른 참여자에게 전송되지 않습니다.
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-border/70 shadow-sm">
              <CardContent className="p-3 sm:p-5">
                <div
                  data-lk-theme="default"
                  className="conference-prejoin overflow-hidden rounded-xl border bg-muted/20 p-3 sm:p-4"
                >
                  <PreJoin
                    defaults={{
                      username: participantName,
                      videoEnabled: true,
                      audioEnabled: true,
                    }}
                    joinLabel="회의 참여하기"
                    micLabel="마이크"
                    camLabel="카메라"
                    userLabel="이름"
                    persistUserChoices={false}
                    onSubmit={(choices) => {
                      setPreviewError(null)
                      setUserChoices(choices)
                    }}
                    onError={() => {
                      setPreviewError(
                        "카메라 또는 마이크 권한이 차단되었습니다. 브라우저 사이트 설정에서 권한을 허용해주세요."
                      )
                    }}
                  />
                </div>
                {previewError && (
                  <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-700 dark:text-amber-300">
                    {previewError}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
        <ConfirmDialog
          open={endDialogOpen}
          onOpenChange={setEndDialogOpen}
          title="화상회의를 종료하시겠어요?"
          description="모든 참여자의 연결이 종료되며 다시 참여하려면 새 회의를 시작해야 합니다."
          confirmLabel="회의 종료"
          loadingLabel="종료 중..."
          loading={endMeeting.isPending}
          error={endError}
          onConfirm={() => void handleEndMeeting()}
        />
      </>
    )
  }

  return (
    <>
      <section className="flex h-[calc(100svh-4.25rem)] min-h-[620px] flex-col overflow-hidden bg-muted/30">
        <ConferenceHeader
          meetingId={meetingId}
          roomName={currentConnection.roomId}
          isLeader={isLeader}
          busy={leaveMeeting.isPending || endMeeting.isPending}
          onLeave={() => void handleLeave()}
          onEnd={() => setEndDialogOpen(true)}
        />
        <div className="min-h-0 flex-1 sm:p-3 lg:p-4">
          <div className="h-full overflow-hidden border-y bg-[#0b0d12] shadow-sm sm:rounded-2xl sm:border">
            <LiveKitRoom
              token={currentConnection.token}
              serverUrl={currentConnection.url}
              connect
              video={
                userChoices.videoEnabled
                  ? { deviceId: userChoices.videoDeviceId || undefined }
                  : false
              }
              audio={
                userChoices.audioEnabled
                  ? { deviceId: userChoices.audioDeviceId || undefined }
                  : false
              }
              data-lk-theme="default"
              className="conference-room h-full"
              onConnected={() => {
                activateConference(meetingId, currentConnection.userId)
              }}
              onDisconnected={() => void handleLeave()}
              onError={(error) => setConnectionError(error.message)}
            >
              <ConferenceRoomContent />
            </LiveKitRoom>
          </div>
        </div>
      </section>
      <ConfirmDialog
        open={endDialogOpen}
        onOpenChange={setEndDialogOpen}
        title="화상회의를 종료하시겠어요?"
        description="모든 참여자의 연결이 종료되며 다시 참여하려면 새 회의를 시작해야 합니다."
        confirmLabel="회의 종료"
        loadingLabel="종료 중..."
        loading={endMeeting.isPending}
        error={endError}
        onConfirm={() => void handleEndMeeting()}
      />
    </>
  )
}

function ConferenceRoomContent() {
  const participants = useParticipants()
  const connectionState = useConnectionState()
  const isConnected = connectionState === "connected"

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#0b0d12] text-white">
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-white/8 px-3 sm:px-5">
        <div className="flex items-center gap-2 text-xs text-white/55">
          <span className="flex items-center gap-1.5">
            <span
              className={`size-1.5 rounded-full ${isConnected ? "bg-emerald-400" : "bg-amber-400"}`}
            />
            {isConnected ? "연결됨" : "연결 중"}
          </span>
          <span className="h-3 w-px bg-white/10" />
          <span className="flex items-center gap-1.5">
            <Users className="size-3.5" aria-hidden />
            참여자 {participants.length}명
          </span>
        </div>
        <span className="hidden items-center gap-1.5 text-xs text-white/40 sm:flex">
          <Wifi className="size-3.5" aria-hidden />
          안정적인 네트워크 환경을 권장합니다
        </span>
      </div>
      <div className="min-h-0 flex-1">
        <LiveKitVideoConference />
      </div>
    </div>
  )
}

type ConferenceHeaderProps = {
  meetingId: number
  roomName: string
  isLeader: boolean
  busy: boolean
  onLeave: () => void
  onEnd: () => void
}

function ConferenceHeader({
  meetingId,
  roomName,
  isLeader,
  busy,
  onLeave,
  onEnd,
}: ConferenceHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-background px-5 py-4 sm:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Video className="size-5" aria-hidden />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold sm:text-base">
              화상회의
            </p>
            <Badge
              variant="outline"
              className="h-6 rounded-full px-2 text-[10px] font-medium"
            >
              MEETING {meetingId}
            </Badge>
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {roomName}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onLeave} disabled={busy}>
          <LogOut className="size-4" aria-hidden />
          나가기
        </Button>
        {isLeader && (
          <Button
            variant="destructive"
            size="sm"
            onClick={onEnd}
            disabled={busy}
          >
            <PhoneOff className="size-4" aria-hidden />
            회의 종료
          </Button>
        )}
      </div>
    </div>
  )
}

type PreviewGuideProps = {
  icon: typeof Video
  text: string
}

function PreviewGuide({ icon: Icon, text }: PreviewGuideProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg px-1 py-1.5 text-sm text-foreground">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="size-4" aria-hidden />
      </span>
      {text}
    </div>
  )
}

type ConferenceErrorProps = {
  message: string
  onBack: () => void
  activeMeetingId?: number | null
}

function ConferenceError({
  message,
  onBack,
  activeMeetingId,
}: ConferenceErrorProps) {
  const router = useRouter()

  return (
    <section className="mx-auto flex min-h-[70vh] w-full max-w-xl items-center px-6">
      <Card className="w-full rounded-lg">
        <CardHeader>
          <div className="mb-3 flex size-11 items-center justify-center rounded-lg bg-muted">
            <VideoOff className="size-5" aria-hidden />
          </div>
          <CardTitle>화상회의에 입장할 수 없습니다</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {activeMeetingId && (
            <Button
              onClick={() =>
                router.push(`/meetings/${activeMeetingId}/conference`)
              }
            >
              참여 중인 회의로 이동
            </Button>
          )}
          <Button variant="secondary" onClick={onBack}>
            대시보드로 돌아가기
          </Button>
        </CardContent>
      </Card>
    </section>
  )
}
