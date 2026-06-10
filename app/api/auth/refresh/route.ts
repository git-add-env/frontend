import { getToken } from "next-auth/jwt"
import { type NextRequest, NextResponse } from "next/server"

import { ApiFetchError, apiFetchWithMeta } from "@/lib/api/api-fetch"
import { getBackendAuthCookieHeader } from "@/lib/auth/backend-cookies"

const API_BASE_URL = process.env.BACKEND_API_URL
const REFRESH_PATH = "/api/auth/refresh"

type RefreshResponse = {
  accessToken: string
}

export async function POST(request: NextRequest) {
  if (!API_BASE_URL) {
    return NextResponse.json({ message: "BACKEND_API_URL is not configured" }, { status: 500 })
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  const cookieHeader = getBackendAuthCookieHeader(
    request.headers.get("cookie"),
    token?.backendAuthCookieNames,
    token?.backendAuthCookieHeader,
  )

  if (!cookieHeader) {
    return NextResponse.json({ message: "Refresh token cookie is missing" }, { status: 401 })
  }

  try {
    const result = await apiFetchWithMeta<RefreshResponse>(REFRESH_PATH, {
      method: "POST",
      baseUrl: API_BASE_URL,
      cache: "no-store",
      headers: {
        Cookie: cookieHeader,
      },
    })
    const response = NextResponse.json(result.data)
    const setCookie = result.response.headers.get("set-cookie")

    if (setCookie) {
      response.headers.set("set-cookie", setCookie)
    }

    return response
  } catch (error) {
    if (error instanceof ApiFetchError) {
      return NextResponse.json(error.data ?? { message: error.message }, { status: error.status })
    }

    return NextResponse.json({ message: "Failed to refresh access token" }, { status: 500 })
  }
}
