import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth/options"

const API_BASE_URL = process.env.BACKEND_API_URL

type ServerApiClientOptions = RequestInit & {
  auth?: boolean
}

export async function serverApiClient<TResponse>(
  path: string,
  { auth = true, headers, ...init }: ServerApiClientOptions = {},
) {
  if (!API_BASE_URL) {
    throw new Error("BACKEND_API_URL is not configured")
  }

  const session = auth ? await getServerSession(authOptions) : null
  const accessToken = session?.accessToken

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    cache: "no-store",
  })

  if (!response.ok) {
    // TODO: 백엔드 에러 스펙 확정 후 프론트 공통 에러 처리와 연결하세요.
    throw new Error(`Server API request failed: ${response.status}`)
  }

  if (response.status === 204) {
    return undefined as TResponse
  }

  return response.json() as Promise<TResponse>
}
