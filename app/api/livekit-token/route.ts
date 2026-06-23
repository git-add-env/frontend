import { getToken } from "next-auth/jwt"
import { NextRequest, NextResponse } from "next/server"
import { AccessToken } from "livekit-server-sdk"

const MAX_ROOM_NAME_LENGTH = 100
const MAX_PARTICIPANT_NAME_LENGTH = 50

export async function POST(request: NextRequest) {
  try {
    // 실제 회의 토큰은 백엔드 start/join API가 권한을 검증한 뒤 발급한다.
    // 이 라우트는 로컬 LiveKit UI 검증용이므로 운영 환경에서는 노출하지 않는다.
    if (process.env.NODE_ENV !== "development") {
      return failResponse("LiveKit test route is not available.", 404)
    }

    const sessionToken = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })

    if (!sessionToken?.accessToken || !sessionToken.appUser) {
      return failResponse("Authentication is required.", 401)
    }

    const body: unknown = await request.json()

    if (!isRecord(body)) {
      return failResponse("A JSON object is required.", 400)
    }

    const roomName = normalizeText(body.roomName, MAX_ROOM_NAME_LENGTH)
    const participantName = normalizeText(
      body.participantName,
      MAX_PARTICIPANT_NAME_LENGTH
    )

    if (!roomName || !participantName) {
      return failResponse("roomName and participantName are required.", 400)
    }

    const testRoomName = `dev-test-${roomName}`
    const livekitUrl =
      process.env.LIVEKIT_URL ?? process.env.NEXT_PUBLIC_LIVEKIT_URL
    const apiKey = process.env.LIVEKIT_API_KEY
    const apiSecret = process.env.LIVEKIT_API_SECRET

    if (!livekitUrl || !apiKey || !apiSecret || apiSecret === "replace-me") {
      return errorResponse(
        "LiveKit environment variables are not configured.",
        500
      )
    }

    const token = new AccessToken(apiKey, apiSecret, {
      identity: `${sessionToken.appUser.id}-${crypto.randomUUID()}`,
      name: participantName,
      ttl: "2h",
    })

    token.addGrant({
      room: testRoomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    })

    return NextResponse.json({
      status: "success",
      data: {
        roomId: testRoomName,
        url: livekitUrl,
        token: await token.toJwt(),
      },
    })
  } catch {
    return errorResponse("Failed to create LiveKit token.", 500)
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function normalizeText(value: unknown, maxLength: number) {
  if (typeof value !== "string") {
    return null
  }

  const trimmed = value.trim()

  return trimmed.length > 0 && trimmed.length <= maxLength ? trimmed : null
}

function failResponse(message: string, status: number) {
  return NextResponse.json(
    {
      status: "fail",
      data: { message },
    },
    { status }
  )
}

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    {
      status: "error",
      data: { message },
    },
    { status }
  )
}
