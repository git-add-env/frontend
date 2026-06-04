import { getSession } from "next-auth/react"

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL

type ApiClientOptions = RequestInit & {
  auth?: boolean
}

export async function apiClient<TResponse>(
  path: string,
  { auth = true, headers, ...init }: ApiClientOptions = {},
) {
  if (!API_BASE_URL) {
    throw new Error("NEXT_PUBLIC_BACKEND_API_URL is not configured")
  }

  const session = auth ? await getSession() : null
  const accessToken = session?.accessToken

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
  })

  if (!response.ok) {
    // TODO: 백엔드 공통 에러 응답 형식이 정해지면 커스텀 ApiError로 status/code/message를 보존하세요.
    throw new Error(`API request failed: ${response.status}`)
  }

  if (response.status === 204) {
    return undefined as TResponse
  }

  return response.json() as Promise<TResponse>
}
