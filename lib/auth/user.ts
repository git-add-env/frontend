import { apiClient } from "@/lib/api/api-client"
import type { AppUser } from "@/lib/auth/backend"
import { requestAccessTokenRefresh } from "@/lib/auth/refresh"

const AUTH_USER_PATH = "/api/users/me"
const LOGOUT_PATH = "/api/auth/logout"

type MeResponse = {
  user: AppUser
}

export function getAuthUser() {
  return apiClient<MeResponse>(AUTH_USER_PATH).then((data) => data.user)
}

export function refreshAccessToken() {
  return requestAccessTokenRefresh()
}

export function logoutBackend() {
  return apiClient<null>(LOGOUT_PATH, {
    method: "POST",
    auth: false,
    credentials: "include",
  })
}
