"use client"

import { type FormEvent, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  isTrackReference,
  supportsScreenSharing,
  type LocalUserChoices,
} from "@livekit/components-core"
import { useQuery } from "@tanstack/react-query"
import { MediaDeviceFailure, Track } from "livekit-client"
import {
  ConnectionStateToast,
  GridLayout,
  LiveKitRoom,
  MediaDeviceMenu,
  ParticipantName,
  ParticipantPlaceholder,
  ParticipantTile,
  PreJoin,
  RoomAudioRenderer,
  StartMediaButton,
  TrackToggle,
  TrackMutedIndicator,
  VideoTrack,
  useConnectionState,
  useChat,
  useParticipants,
  useTrackRefContext,
  useTracks,
} from "@livekit/components-react"
import {
  Loader2,
  LogOut,
  MessageCircle,
  PhoneOff,
  Send,
  Users,
  VideoOff,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
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
import { fetchMeetingDetail, fetchMeetingMembers } from "@/lib/api/meetings"
import { notify } from "@/lib/notify"
import { useConferenceStore } from "@/stores/conference-store"

type MeetingConferenceRoomProps = {
  meetingId: number | null
}

function getMediaDeviceErrorMessage(
  failure?: MediaDeviceFailure,
  kind?: MediaDeviceKind
) {
  const deviceName =
    kind === "videoinput"
      ? "카메라"
      : kind === "audioinput"
        ? "마이크"
        : "카메라 또는 마이크"

  if (failure === MediaDeviceFailure.PermissionDenied) {
    return `${deviceName} 권한이 차단되어 꺼진 상태로 입장했습니다. 브라우저 권한을 허용한 뒤 아래 버튼으로 다시 켤 수 있습니다.`
  }

  if (failure === MediaDeviceFailure.NotFound) {
    return `${deviceName} 장치를 찾지 못해 꺼진 상태로 입장했습니다.`
  }

  if (failure === MediaDeviceFailure.DeviceInUse) {
    return `${deviceName}가 다른 앱에서 사용 중이라 꺼진 상태로 입장했습니다.`
  }

  return `${deviceName}를 사용할 수 없어 꺼진 상태로 입장했습니다.`
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
  const [mediaDeviceError, setMediaDeviceError] = useState<string | null>(null)
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
  const { data: meetingMembers } = useQuery({
    queryKey: queryKeys.meetings.members(meetingId ?? 0),
    queryFn: () => fetchMeetingMembers(meetingId as number),
    enabled: meetingId !== null && authStatus === "authenticated",
    select: (data) => data.members,
  })
  const isLeader = meetingDetail?.isLeader ?? false
  const hostUserId = meetingMembers?.find((member) => member.isLeader)?.id

  useEffect(() => {
    const isActiveConference = Boolean(
      userChoices && currentConnection && !connectionError
    )

    document.body.classList.toggle("conference-active", isActiveConference)

    return () => {
      document.body.classList.remove("conference-active")
    }
  }, [connectionError, currentConnection, userChoices])

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
      <section className="flex min-h-[70vh] items-center justify-center bg-[#f5f6f8] px-6">
        <div className="flex flex-col items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-full bg-background shadow-sm ring-1 ring-border">
            <Loader2 className="size-6 animate-spin text-primary" aria-hidden />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            회의 준비 중
          </p>
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
        <section className="relative flex min-h-[calc(100svh-4.5rem)] flex-col bg-[#f5f6f8]">
          <div className="mx-auto flex w-full max-w-4xl flex-1 items-center px-4 py-8 sm:px-6">
            <Card
              className="conference-prejoin-card w-full gap-4 rounded-2xl py-5 shadow-sm ring-black/8"
              style={{ overflow: "visible" }}
            >
              <CardHeader className="text-center">
                <CardTitle className="text-xl font-semibold">입장 준비</CardTitle>
                <CardDescription>
                  카메라와 마이크를 확인하세요.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-3 sm:px-5">
                <div
                  data-lk-theme="default"
                  className="conference-prejoin overflow-visible rounded-xl bg-muted/30"
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
                  <p className="mt-3 rounded-lg bg-amber-500/10 px-3 py-2.5 text-sm text-amber-700 dark:text-amber-300">
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
      <section className="relative flex h-svh min-h-[620px] flex-col overflow-hidden bg-[#080a0f]">
        <div className="min-h-0 flex-1 p-2 sm:p-3">
          <div className="relative h-full overflow-hidden bg-[#0b0d12] sm:rounded-2xl sm:ring-1 sm:ring-white/10">
            {mediaDeviceError && (
              <div
                role="status"
                className="absolute left-1/2 top-16 z-20 w-[calc(100%-1.5rem)] max-w-xl -translate-x-1/2 rounded-xl bg-amber-950/95 px-4 py-3 text-sm text-amber-100 shadow-xl ring-1 ring-amber-300/20 backdrop-blur"
              >
                {mediaDeviceError}
              </div>
            )}
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
              onMediaDeviceFailure={(failure, kind) => {
                setMediaDeviceError(getMediaDeviceErrorMessage(failure, kind))
              }}
              onError={(error) => {
                const mediaFailure = MediaDeviceFailure.getFailure(error)

                if (mediaFailure) {
                  setMediaDeviceError(
                    getMediaDeviceErrorMessage(mediaFailure)
                  )
                  return
                }

                setConnectionError(error.message)
              }}
            >
              <ConferenceRoomContent
                hostIdentity={
                  hostUserId !== undefined
                    ? String(hostUserId)
                    : isLeader
                      ? currentConnection.userId
                      : null
                }
                isLeader={isLeader}
                busy={leaveMeeting.isPending || endMeeting.isPending}
                onLeave={() => void handleLeave()}
                onEnd={() => setEndDialogOpen(true)}
              />
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

type ConferenceRoomContentProps = {
  hostIdentity: string | null
  isLeader: boolean
  busy: boolean
  onLeave: () => void
  onEnd: () => void
}

function ConferenceRoomContent({
  hostIdentity,
  isLeader,
  busy,
  onLeave,
  onEnd,
}: ConferenceRoomContentProps) {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const participants = useParticipants()
  const connectionState = useConnectionState()
  const isConnected = connectionState === "connected"
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  )

  return (
    <div className="relative h-full min-h-0 bg-[#0b0d12] text-white">
      <div className="pointer-events-none absolute left-3 top-3 z-10 flex items-center gap-2 rounded-full bg-black/55 px-3 py-2 text-xs text-white/80 shadow-lg backdrop-blur-md">
        <span
          className={`size-2 rounded-full ${isConnected ? "bg-emerald-400" : "bg-amber-400"}`}
        />
        <span>{isConnected ? "연결됨" : "연결 중"}</span>
        <span className="h-3 w-px bg-white/20" />
        <Users className="size-3.5" aria-hidden />
        <span>{participants.length}</span>
      </div>
      <div className="h-full min-h-0">
        <div className="lk-video-conference">
          <div className="lk-video-conference-inner">
            <div className="lk-grid-layout-wrapper">
              <GridLayout tracks={tracks}>
                <ConferenceParticipantTile hostIdentity={hostIdentity} />
              </GridLayout>
            </div>
            <ConferenceControlBar
              isChatOpen={isChatOpen}
              onChatToggle={() => setIsChatOpen((open) => !open)}
              isLeader={isLeader}
              busy={busy}
              onLeave={onLeave}
              onEnd={onEnd}
            />
          </div>
          {isChatOpen && (
            <ConferenceChatPanel onClose={() => setIsChatOpen(false)} />
          )}
          <RoomAudioRenderer />
          <ConnectionStateToast />
        </div>
      </div>
    </div>
  )
}

type ConferenceParticipantTileProps = {
  hostIdentity: string | null
}

function ConferenceParticipantTile({
  hostIdentity,
}: ConferenceParticipantTileProps) {
  const trackRef = useTrackRefContext()
  const participant = trackRef.participant
  const isHost =
    hostIdentity !== null && String(participant.identity) === hostIdentity

  return (
    <ParticipantTile trackRef={trackRef}>
      {isTrackReference(trackRef) && <VideoTrack trackRef={trackRef} />}
      <div className="lk-participant-placeholder">
        <ParticipantPlaceholder />
      </div>
      <div className="conference-participant-meta">
        <TrackMutedIndicator
          trackRef={{ participant, source: Track.Source.Microphone }}
          show="always"
        />
        <ParticipantName participant={participant} />
        {isHost && <span className="conference-host-badge">호스트</span>}
      </div>
    </ParticipantTile>
  )
}

type ConferenceControlBarProps = {
  isChatOpen: boolean
  onChatToggle: () => void
  isLeader: boolean
  busy: boolean
  onLeave: () => void
  onEnd: () => void
}

function ConferenceControlBar({
  isChatOpen,
  onChatToggle,
  isLeader,
  busy,
  onLeave,
  onEnd,
}: ConferenceControlBarProps) {
  const [isScreenShareEnabled, setIsScreenShareEnabled] = useState(false)

  return (
    <div className="lk-control-bar">
      <div className="lk-button-group">
        <TrackToggle source={Track.Source.Microphone}>마이크</TrackToggle>
        <div className="lk-button-group-menu">
          <MediaDeviceMenu kind="audioinput" />
        </div>
      </div>
      <div className="lk-button-group">
        <TrackToggle source={Track.Source.Camera}>카메라</TrackToggle>
        <div className="lk-button-group-menu">
          <MediaDeviceMenu kind="videoinput" />
        </div>
      </div>
      {supportsScreenSharing() && (
        <TrackToggle
          source={Track.Source.ScreenShare}
          captureOptions={{ audio: true, selfBrowserSurface: "include" }}
          onChange={setIsScreenShareEnabled}
        >
          {isScreenShareEnabled ? "공유 중지" : "화면 공유"}
        </TrackToggle>
      )}
      <button
        type="button"
        className="lk-button"
        aria-pressed={isChatOpen}
        onClick={onChatToggle}
      >
        <MessageCircle className="size-4" aria-hidden />
        채팅
      </button>
      <span className="conference-control-divider" aria-hidden="true" />
      <button
        type="button"
        className="lk-button conference-leave-button"
        onClick={onLeave}
        disabled={busy}
      >
        <LogOut className="size-4" aria-hidden />
        나가기
      </button>
      {isLeader && (
        <button
          type="button"
          className="lk-button conference-end-button"
          onClick={onEnd}
          disabled={busy}
        >
          <PhoneOff className="size-4" aria-hidden />
          회의 종료
        </button>
      )}
      <StartMediaButton label="미디어 재생" />
    </div>
  )
}

type ConferenceChatPanelProps = {
  onClose: () => void
}

function ConferenceChatPanel({ onClose }: ConferenceChatPanelProps) {
  const { chatMessages, send, isSending } = useChat()
  const [message, setMessage] = useState("")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextMessage = message.trim()

    if (!nextMessage || isSending) return

    await send(nextMessage)
    setMessage("")
  }

  return (
    <aside className="conference-chat" aria-label="회의 채팅">
      <div className="conference-chat-header">
        <div>
          <p className="font-semibold">채팅</p>
          <p className="text-xs text-white/45">현재 참여자에게만 보여요</p>
        </div>
        <button
          type="button"
          className="conference-chat-close"
          aria-label="채팅 닫기"
          onClick={onClose}
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
      <div className="conference-chat-messages" aria-live="polite">
        {chatMessages.length === 0 ? (
          <div className="conference-chat-empty">
            <MessageCircle className="size-5" aria-hidden />
            <span>첫 메시지를 남겨보세요</span>
          </div>
        ) : (
          chatMessages.map((chatMessage, index) => (
            <div
              key={chatMessage.id ?? `${chatMessage.timestamp}-${index}`}
              className="conference-chat-message"
            >
              <div className="conference-chat-message-meta">
                <span>
                  {chatMessage.from?.name ??
                    chatMessage.from?.identity ??
                    "참가자"}
                </span>
                <time>
                  {new Date(chatMessage.timestamp).toLocaleTimeString("ko-KR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              </div>
              <p>{chatMessage.message}</p>
            </div>
          ))
        )}
      </div>
      <form className="conference-chat-form" onSubmit={handleSubmit}>
        <input
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="메시지 입력"
          aria-label="채팅 메시지"
          disabled={isSending}
        />
        <button
          type="submit"
          aria-label="메시지 보내기"
          disabled={!message.trim() || isSending}
        >
          <Send className="size-4" aria-hidden />
        </button>
      </form>
    </aside>
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
