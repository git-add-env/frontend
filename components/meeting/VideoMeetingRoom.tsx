"use client"

import {
  Camera,
  CameraOff,
  Captions,
  Maximize2,
  MessageSquare,
  Mic,
  MicOff,
  MonitorUp,
  PhoneOff,
  Send,
  Settings,
  Users,
} from "lucide-react"
import { useMemo, useState } from "react"
import type { FormEvent, ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type VideoMeetingRoomProps = {
  meetingId?: string
  roomId?: string
}

type Participant = {
  id: number
  name: string
  role: "host" | "member"
  isSpeaking: boolean
  isMuted: boolean
  cameraOn: boolean
}

type ChatMessage = {
  id: number
  sender: string
  message: string
  time: string
}

const participants: Participant[] = [
  {
    id: 1,
    name: "나",
    role: "host",
    isSpeaking: true,
    isMuted: false,
    cameraOn: true,
  },
  {
    id: 2,
    name: "김민지",
    role: "member",
    isSpeaking: false,
    isMuted: true,
    cameraOn: true,
  },
  {
    id: 3,
    name: "이서준",
    role: "member",
    isSpeaking: false,
    isMuted: false,
    cameraOn: false,
  },
  {
    id: 4,
    name: "박지훈",
    role: "member",
    isSpeaking: false,
    isMuted: true,
    cameraOn: true,
  },
]

const chatMessages: ChatMessage[] = [
  {
    id: 1,
    sender: "김민지",
    message: "자료 확인했습니다.",
    time: "14:02",
  },
  {
    id: 2,
    sender: "이서준",
    message: "다음 안건부터 같이 보면 좋을 것 같아요.",
    time: "14:04",
  },
]

export function VideoMeetingRoom({ meetingId, roomId }: VideoMeetingRoomProps) {
  const [isMicOn, setIsMicOn] = useState(true)
  const [isCameraOn, setIsCameraOn] = useState(true)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [isCaptionOn, setIsCaptionOn] = useState(false)
  const [activePanel, setActivePanel] = useState<"chat" | "members">("chat")

  const roomLabel = useMemo(() => {
    if (roomId) return roomId
    if (meetingId) return `meeting-${meetingId}`
    return "preview-room"
  }, [meetingId, roomId])

  const activeParticipants = participants.filter((participant) => participant.cameraOn)
  const hiddenParticipants = participants.length - activeParticipants.length

  function handleToggleMic() {
    setIsMicOn((current) => !current)
  }

  function handleToggleCamera() {
    setIsCameraOn((current) => !current)
  }

  function handleToggleScreenShare() {
    setIsScreenSharing((current) => !current)
  }

  function handleToggleCaption() {
    setIsCaptionOn((current) => !current)
  }

  function handleShowChat() {
    setActivePanel("chat")
  }

  function handleShowMembers() {
    setActivePanel("members")
  }

  function handleSubmitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
  }

  return (
    <section className="flex min-h-[calc(100svh-8rem)] flex-col bg-background">
      <div className="flex flex-1 flex-col gap-4 px-4 py-4 lg:px-6">
        <header className="flex flex-col gap-3 border-b border-border pb-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-xl font-semibold tracking-normal">
                화상 회의
              </h1>
              <Badge variant="active" className="h-7 rounded-full">
                진행 중
              </Badge>
              {isScreenSharing && (
                <Badge variant="accent" className="h-7 rounded-full">
                  화면 공유
                </Badge>
              )}
            </div>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {roomLabel}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              title="전체 화면"
              aria-label="전체 화면"
            >
              <Maximize2 />
            </Button>
            <Button
              variant="outline"
              size="icon"
              title="회의 설정"
              aria-label="회의 설정"
            >
              <Settings />
            </Button>
          </div>
        </header>

        <div className="grid flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex min-h-[560px] flex-col gap-4">
            <div className="grid flex-1 auto-rows-fr gap-3 md:grid-cols-2">
              {participants.map((participant) => (
                <ParticipantTile
                  key={participant.id}
                  participant={participant}
                  isLocal={participant.id === 1}
                  localCameraOn={isCameraOn}
                  localMicOn={isMicOn}
                />
              ))}
            </div>

            <div className="flex flex-col gap-3 rounded-lg border border-border bg-card px-3 py-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="size-4" />
                <span>{participants.length}명 참여 중</span>
                {hiddenParticipants > 0 && (
                  <span>카메라 꺼짐 {hiddenParticipants}명</span>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <ControlButton
                  active={isMicOn}
                  activeLabel="마이크 켜짐"
                  inactiveLabel="마이크 꺼짐"
                  onClick={handleToggleMic}
                >
                  {isMicOn ? <Mic /> : <MicOff />}
                </ControlButton>
                <ControlButton
                  active={isCameraOn}
                  activeLabel="카메라 켜짐"
                  inactiveLabel="카메라 꺼짐"
                  onClick={handleToggleCamera}
                >
                  {isCameraOn ? <Camera /> : <CameraOff />}
                </ControlButton>
                <ControlButton
                  active={isScreenSharing}
                  activeLabel="화면 공유 중"
                  inactiveLabel="화면 공유"
                  onClick={handleToggleScreenShare}
                >
                  <MonitorUp />
                </ControlButton>
                <ControlButton
                  active={isCaptionOn}
                  activeLabel="자막 켜짐"
                  inactiveLabel="자막"
                  onClick={handleToggleCaption}
                >
                  <Captions />
                </ControlButton>
                <Button
                  variant="destructive"
                  size="icon-lg"
                  title="회의 나가기"
                  aria-label="회의 나가기"
                >
                  <PhoneOff />
                </Button>
              </div>
            </div>
          </div>

          <aside className="flex min-h-[560px] flex-col rounded-lg border border-border bg-card">
            <div className="grid grid-cols-2 border-b border-border p-2">
              <PanelTab
                active={activePanel === "chat"}
                label="채팅"
                onClick={handleShowChat}
              >
                <MessageSquare />
              </PanelTab>
              <PanelTab
                active={activePanel === "members"}
                label="참여자"
                onClick={handleShowMembers}
              >
                <Users />
              </PanelTab>
            </div>

            {activePanel === "chat" ? (
              <ChatPanel onSubmit={handleSubmitMessage} />
            ) : (
              <MembersPanel />
            )}
          </aside>
        </div>
      </div>
    </section>
  )
}

type ParticipantTileProps = {
  participant: Participant
  isLocal: boolean
  localCameraOn: boolean
  localMicOn: boolean
}

function ParticipantTile({
  participant,
  isLocal,
  localCameraOn,
  localMicOn,
}: ParticipantTileProps) {
  const cameraOn = isLocal ? localCameraOn : participant.cameraOn
  const isMuted = isLocal ? !localMicOn : participant.isMuted

  return (
    <div
      className={cn(
        "relative flex min-h-56 overflow-hidden rounded-lg border bg-muted",
        participant.isSpeaking && "border-emerald-500",
      )}
    >
      {cameraOn ? (
        <div className="flex flex-1 items-center justify-center bg-[radial-gradient(circle_at_top_left,_oklch(0.87_0_0),_oklch(0.32_0_0))]">
          <div className="flex size-24 items-center justify-center rounded-full border border-white/30 bg-white/15 text-3xl font-semibold text-white">
            {participant.name.slice(0, 1)}
          </div>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center bg-secondary">
          <div className="flex size-24 items-center justify-center rounded-full bg-background text-3xl font-semibold">
            {participant.name.slice(0, 1)}
          </div>
        </div>
      )}

      <div className="absolute right-3 top-3 flex gap-2">
        {isMuted && (
          <span
            className="flex size-8 items-center justify-center rounded-md bg-background/90 text-foreground"
            title="마이크 꺼짐"
            aria-label="마이크 꺼짐"
          >
            <MicOff className="size-4" />
          </span>
        )}
        {!cameraOn && (
          <span
            className="flex size-8 items-center justify-center rounded-md bg-background/90 text-foreground"
            title="카메라 꺼짐"
            aria-label="카메라 꺼짐"
          >
            <CameraOff className="size-4" />
          </span>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/70 to-transparent p-3 text-white">
        <span className="truncate text-sm font-medium">{participant.name}</span>
        {participant.role === "host" && (
          <span className="rounded-sm bg-white/15 px-2 py-0.5 text-xs">
            호스트
          </span>
        )}
      </div>
    </div>
  )
}

type ControlButtonProps = {
  active: boolean
  activeLabel: string
  inactiveLabel: string
  onClick: () => void
  children: ReactNode
}

function ControlButton({
  active,
  activeLabel,
  inactiveLabel,
  onClick,
  children,
}: ControlButtonProps) {
  const label = active ? activeLabel : inactiveLabel

  return (
    <Button
      variant={active ? "outline" : "secondary"}
      size="icon-lg"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(!active && "border-border")}
    >
      {children}
    </Button>
  )
}

type PanelTabProps = {
  active: boolean
  label: string
  onClick: () => void
  children: ReactNode
}

function PanelTab({ active, label, onClick, children }: PanelTabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-9 items-center justify-center gap-2 rounded-md text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        active && "bg-muted font-medium text-foreground",
      )}
    >
      {children}
      {label}
    </button>
  )
}

type ChatPanelProps = {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

function ChatPanel({ onSubmit }: ChatPanelProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
        {chatMessages.map((chat) => (
          <div key={chat.id} className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>{chat.sender}</span>
              <span>{chat.time}</span>
            </div>
            <p className="rounded-lg bg-muted px-3 py-2 text-sm">
              {chat.message}
            </p>
          </div>
        ))}
      </div>

      <form className="flex gap-2 border-t border-border p-3" onSubmit={onSubmit}>
        <label className="sr-only" htmlFor="meeting-chat-message">
          채팅 메시지
        </label>
        <input
          id="meeting-chat-message"
          placeholder="메시지 입력"
          className="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button size="icon" aria-label="메시지 보내기" title="메시지 보내기">
          <Send />
        </Button>
      </form>
    </div>
  )
}

function MembersPanel() {
  return (
    <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
      {participants.map((participant) => (
        <div
          key={participant.id}
          className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2"
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">
              {participant.name.slice(0, 1)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{participant.name}</p>
              <p className="text-xs text-muted-foreground">
                {participant.role === "host" ? "호스트" : "멤버"}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1 text-muted-foreground">
            {participant.isMuted ? (
              <MicOff className="size-4" />
            ) : (
              <Mic className="size-4" />
            )}
            {participant.cameraOn ? (
              <Camera className="size-4" />
            ) : (
              <CameraOff className="size-4" />
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
