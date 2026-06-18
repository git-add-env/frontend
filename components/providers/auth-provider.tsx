"use client"

import { useEffect, type ReactNode } from "react"
import { SessionProvider, useSession } from "next-auth/react"
import { useQueryClient } from "@tanstack/react-query"

import { queryKeys } from "@/hooks/api/query-keys"
import { clearAuthScopedQueries } from "@/lib/auth/query-cache"
import { onAccessTokenRefreshed } from "@/lib/auth/refresh"
import { useAuthStore } from "@/stores/auth-store"

function AccessTokenRefreshListener() {
  const { update } = useSession()

  useEffect(() => {
    return onAccessTokenRefreshed((event) => {
      void update({
        accessToken: event.detail.accessToken,
      })
    })
  }, [update])

  return null
}

export function AuthQuerySync() {
  const { data: session, status } = useSession()
  const queryClient = useQueryClient()
  const clearUser = useAuthStore((state) => state.clearUser)
  const accessToken = session?.accessToken ?? null

  useEffect(() => {
    if (status === "loading") return

    if (status === "unauthenticated") {
      clearUser()
      clearAuthScopedQueries(queryClient)
      return
    }

    if (!accessToken) return

    clearAuthScopedQueries(queryClient)
    void queryClient.invalidateQueries({ queryKey: queryKeys.auth.me })
  }, [accessToken, clearUser, queryClient, status])

  return null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AccessTokenRefreshListener />
      {children}
    </SessionProvider>
  )
}
