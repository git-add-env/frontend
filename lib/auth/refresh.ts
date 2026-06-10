const REFRESH_PATH = "/api/auth/refresh"
const ACCESS_TOKEN_REFRESHED_EVENT = "auth:access-token-refreshed"

type RefreshResponse = {
  accessToken: string
}

export type AccessTokenRefreshedEvent = CustomEvent<RefreshResponse>

export async function requestAccessTokenRefresh() {
  const response = await fetch(REFRESH_PATH, {
    method: "POST",
    credentials: "include",
  })
  const data = (await response.json()) as RefreshResponse | { message?: string }

  if (!response.ok || !("accessToken" in data)) {
    throw new Error("message" in data && data.message ? data.message : "Failed to refresh access token")
  }

  return data
}

export function notifyAccessTokenRefreshed(accessToken: string) {
  if (typeof window === "undefined") {
    return
  }

  window.dispatchEvent(
    new CustomEvent(ACCESS_TOKEN_REFRESHED_EVENT, {
      detail: {
        accessToken,
      },
    }),
  )
}

export function onAccessTokenRefreshed(listener: (event: AccessTokenRefreshedEvent) => void) {
  window.addEventListener(ACCESS_TOKEN_REFRESHED_EVENT, listener as EventListener)

  return () => {
    window.removeEventListener(ACCESS_TOKEN_REFRESHED_EVENT, listener as EventListener)
  }
}
