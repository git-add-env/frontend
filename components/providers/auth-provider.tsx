"use client"

import { useEffect, useRef, type ReactNode } from "react"
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
  // 직전 accessToken을 추적해 "첫 하이드레이션(undefined→토큰)"과 "실제 토큰 변경"을 구분한다.
  // undefined = 아직 한 번도 관찰 안 함, null = 비로그인, string = 로그인 토큰.
  const prevAccessTokenRef = useRef<string | null | undefined>(undefined)

  useEffect(() => {
    if (status === "loading") return

    const prevAccessToken = prevAccessTokenRef.current

    if (status === "unauthenticated") {
      // 로그아웃: 이전에 로그인 상태였을 때만 정리(불필요한 반복 정리 방지).
      if (prevAccessToken) {
        clearUser()
        clearAuthScopedQueries(queryClient)
      }
      prevAccessTokenRef.current = null
      return
    }

    if (!accessToken) return

    // 하드 새로고침의 첫 하이드레이션(undefined/null→토큰)에서는 캐시를 비우지 않는다.
    // 이때 비우면 방금 받아온 데이터를 날려 "로딩 중"에서 멈춘다(재요청도 트리거되지 않음).
    // 이미 로그인된 상태에서 '다른 토큰'으로 바뀐 경우(리프레시/재로그인)에만 정리한다.
    if (prevAccessToken && prevAccessToken !== accessToken) {
      clearAuthScopedQueries(queryClient)
      void queryClient.invalidateQueries({ queryKey: queryKeys.auth.me })
    }

    prevAccessTokenRef.current = accessToken
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
