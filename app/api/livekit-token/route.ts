import { NextRequest, NextResponse } from "next/server"
import { AccessToken } from "livekit-server-sdk"

type LiveKitTokenRequest = {
  roomName?: unknown
  participantName?: unknown
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as LiveKitTokenRequest
  const roomName = normalizeText(body.roomName) ?? "meeting-test-room"
  const participantName = normalizeText(body.participantName) ?? "test-user"
  const livekitUrl = process.env.LIVEKIT_URL ?? process.env.NEXT_PUBLIC_LIVEKIT_URL
  const apiKey = process.env.LIVEKIT_API_KEY
  const apiSecret = process.env.LIVEKIT_API_SECRET

  if (!livekitUrl || !apiKey || !apiSecret || apiSecret === "replace-me") {
    return NextResponse.json(
      {
        status: "fail",
        data: {
          message: "LiveKit environment variables are not configured.",
        },
      },
      { status: 500 },
    )
  }

  const token = new AccessToken(apiKey, apiSecret, {
    identity: `${participantName}-${crypto.randomUUID()}`,
    name: participantName,
    ttl: "2h",
  })

  token.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  })

  return NextResponse.json({
    status: "success",
    data: {
      roomId: roomName,
      url: livekitUrl,
      token: await token.toJwt(),
    },
  })
}

function normalizeText(value: unknown) {
  if (typeof value !== "string") {
    return null
  }

  const trimmed = value.trim()

  return trimmed.length > 0 ? trimmed : null
}
