"use client"

import { useMemo, useState, useSyncExternalStore } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { LocalUserChoices } from "@livekit/components-core"
import {
  LiveKitRoom,
  PreJoin,
  VideoConference,
  useConnectionState,
  useLocalParticipant,
} from "@livekit/components-react"
import { ArrowLeft, VideoOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { TEST_SESSION_KEY } from "./LiveKitTestLauncher"

type LiveKitTestSession = {
  roomName: string
  serverUrl: string
  token: string
}

export function LiveKitTestRoom() {
  const router = useRouter()
  const [userChoices, setUserChoices] = useState<LocalUserChoices | null>(null)
  const [preJoinError, setPreJoinError] = useState<string | null>(null)
  const [roomMessage, setRoomMessage] = useState<string | null>(null)
  const rawSession = useSyncExternalStore(
    subscribeSessionStorage,
    getSessionStorageSnapshot,
    getServerSnapshot,
  )
  const session = useMemo(() => parseLiveKitSession(rawSession), [rawSession])

  if (!session) {
    return (
      <section className="mx-auto flex min-h-[70vh] w-full max-w-xl items-center px-6">
        <Card className="w-full rounded-lg">
          <CardHeader>
            <div className="mb-3 flex size-11 items-center justify-center rounded-lg bg-muted">
              <VideoOff className="size-5" aria-hidden />
            </div>
            <CardTitle>Missing connection info</CardTitle>
            <CardDescription>
              Create a test token before opening the LiveKit room.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/meetings/video-test">
                <ArrowLeft className="size-4" aria-hidden />
                Back to test page
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    )
  }

  if (!userChoices) {
    return (
      <section className="flex min-h-[calc(100svh-8rem)] flex-col bg-neutral-950 text-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div className="min-w-0">
            <p className="text-xs text-white/60">LiveKit Room</p>
            <h1 className="truncate text-base font-semibold">{session.roomName}</h1>
          </div>
          <Button variant="secondary" size="sm" onClick={() => router.push("/meetings/video-test")}>
            <ArrowLeft className="size-4" aria-hidden />
            Back
          </Button>
        </div>

        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-4 px-6 py-8">
          <PreJoin
            defaults={{
              username: "test-user",
              videoEnabled: true,
              audioEnabled: true,
            }}
            joinLabel="Join room"
            micLabel="Microphone"
            camLabel="Camera"
            userLabel="Name"
            persistUserChoices={false}
            onSubmit={(choices) => {
              setPreJoinError(null)
              setUserChoices(choices)
            }}
            onError={(error) => {
              setPreJoinError(error.message)
            }}
          />
          {preJoinError && (
            <p className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-100">
              {preJoinError}
            </p>
          )}
        </div>
      </section>
    )
  }

  return (
    <section className="flex min-h-[calc(100svh-8rem)] flex-col bg-neutral-950 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div className="min-w-0">
          <p className="text-xs text-white/60">LiveKit Room</p>
          <h1 className="truncate text-base font-semibold">{session.roomName}</h1>
        </div>
        <Button variant="secondary" size="sm" onClick={() => router.push("/meetings/video-test")}>
          <ArrowLeft className="size-4" aria-hidden />
          Leave
        </Button>
      </div>

      <LiveKitRoom
        token={session.token}
        serverUrl={session.serverUrl}
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
        className="min-h-0 flex-1"
        onConnected={() => {
          setRoomMessage("Connected to LiveKit.")
        }}
        onDisconnected={(reason) => {
          setRoomMessage(`Disconnected${reason ? `: ${reason}` : ""}.`)
        }}
        onError={(error) => {
          setRoomMessage(error.message)
        }}
        onMediaDeviceFailure={(failure, kind) => {
          setRoomMessage(`Media device failure${kind ? ` (${kind})` : ""}: ${failure ?? "unknown"}`)
        }}
      >
        <LiveKitDebugPanel roomName={session.roomName} message={roomMessage} />
        <VideoConference />
      </LiveKitRoom>
    </section>
  )
}

type LiveKitDebugPanelProps = {
  roomName: string
  message: string | null
}

function LiveKitDebugPanel({ roomName, message }: LiveKitDebugPanelProps) {
  const connectionState = useConnectionState()
  const {
    isCameraEnabled,
    isMicrophoneEnabled,
    cameraTrack,
    microphoneTrack,
    lastCameraError,
    lastMicrophoneError,
    localParticipant,
  } = useLocalParticipant()

  return (
    <div className="absolute right-4 top-36 z-10 max-w-sm rounded-lg border border-white/10 bg-black/80 p-3 text-xs text-white shadow-lg">
      <p className="font-semibold">LiveKit debug</p>
      <dl className="mt-2 space-y-1 text-white/75">
        <div className="flex justify-between gap-4">
          <dt>room</dt>
          <dd className="truncate text-white">{roomName}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>state</dt>
          <dd className="text-white">{connectionState}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>identity</dt>
          <dd className="truncate text-white">{localParticipant.identity || "-"}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>camera</dt>
          <dd className="text-white">{isCameraEnabled ? "on" : "off"}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>camera track</dt>
          <dd className="text-white">{cameraTrack ? "published" : "none"}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>mic</dt>
          <dd className="text-white">{isMicrophoneEnabled ? "on" : "off"}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>mic track</dt>
          <dd className="text-white">{microphoneTrack ? "published" : "none"}</dd>
        </div>
      </dl>
      {message && <p className="mt-2 text-white">{message}</p>}
      {lastCameraError && <p className="mt-2 text-red-200">{lastCameraError.message}</p>}
      {lastMicrophoneError && <p className="mt-2 text-red-200">{lastMicrophoneError.message}</p>}
    </div>
  )
}

function subscribeSessionStorage(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange)

  return () => {
    window.removeEventListener("storage", onStoreChange)
  }
}

function getSessionStorageSnapshot() {
  return sessionStorage.getItem(TEST_SESSION_KEY)
}

function getServerSnapshot() {
  return null
}

function parseLiveKitSession(rawSession: string | null) {
  if (!rawSession) {
    return null
  }

  try {
    return JSON.parse(rawSession) as LiveKitTestSession
  } catch {
    return null
  }
}
