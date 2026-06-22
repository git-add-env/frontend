"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Loader2, Video } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"

const TEST_SESSION_KEY = "livekit-video-test"

type LiveKitTokenResponse = {
  status: "success"
  data: {
    roomId: string
    serverUrl?: string
    url?: string
    token: string
  }
}

type LiveKitErrorResponse = {
  status: "fail" | "error"
  data: {
    message?: string
  } | null
}

type LiveKitTestSession = {
  roomName: string
  serverUrl: string
  token: string
}

export function LiveKitTestLauncher() {
  const router = useRouter()
  const [roomName, setRoomName] = useState("meeting-test-room")
  const [participantName, setParticipantName] = useState("test-user")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch("/api/livekit-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName, participantName }),
      })
      const payload = (await response.json()) as LiveKitTokenResponse | LiveKitErrorResponse

      if (!response.ok || payload.status !== "success") {
        const message =
          payload.status !== "success" ? payload.data?.message : "Failed to create LiveKit token."
        throw new Error(message ?? "Failed to create LiveKit token.")
      }

      const serverUrl = payload.data.url ?? payload.data.serverUrl

      if (!serverUrl) {
        throw new Error("LiveKit URL is missing from the token response.")
      }

      const session: LiveKitTestSession = {
        roomName: payload.data.roomId,
        serverUrl,
        token: payload.data.token,
      }

      sessionStorage.setItem(TEST_SESSION_KEY, JSON.stringify(session))
      router.push("/meetings/video-test/room")
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to start video test.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
      <div className="space-y-3">
        <div className="flex size-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Video className="size-6" aria-hidden />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">LiveKit test</p>
          <h1 className="text-3xl font-semibold tracking-normal">Create a video room</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            This page creates a temporary LiveKit token from the local Next.js route and opens the
            meeting room UI.
          </p>
        </div>
      </div>

      <Card className="max-w-2xl rounded-lg">
        <CardHeader>
          <CardTitle>Test room</CardTitle>
          <CardDescription>
            The LiveKit URL and API keys are read from local environment variables.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={submit}>
            <label className="block space-y-2 text-sm font-medium">
              <span>Room name</span>
              <Input
                value={roomName}
                onChange={(event) => setRoomName(event.target.value)}
                placeholder="meeting-test-room"
              />
            </label>

            <label className="block space-y-2 text-sm font-medium">
              <span>Participant name</span>
              <Input
                value={participantName}
                onChange={(event) => setParticipantName(event.target.value)}
                placeholder="test-user"
              />
            </label>

            {error && (
              <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <ArrowRight className="size-4" aria-hidden />
              )}
              Open video room
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  )
}

export { TEST_SESSION_KEY }
