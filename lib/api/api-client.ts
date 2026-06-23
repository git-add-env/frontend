import { getSession } from "next-auth/react"

import { ApiFetchError, apiFetch } from "@/lib/api/api-fetch"
import { notifyAccessTokenRefreshed, requestAccessTokenRefresh } from "@/lib/auth/refresh"

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL
const REFRESH_PATH = "/api/auth/refresh"

export type ApiClientOptions = RequestInit & {
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

  try {
    return await apiFetch<TResponse>(path, {
      ...init,
      baseUrl: API_BASE_URL,
      token: session?.accessToken,
      headers,
    })
  } catch (error) {
    if (!(error instanceof ApiFetchError) || error.status !== 401 || !auth || path === REFRESH_PATH) {
      throw error
    }

    const refreshed = await requestAccessTokenRefresh()
    notifyAccessTokenRefreshed(refreshed.accessToken)

    return apiFetch<TResponse>(path, {
      ...init,
      baseUrl: API_BASE_URL,
      token: refreshed.accessToken,
      headers,
    })
  }
}
