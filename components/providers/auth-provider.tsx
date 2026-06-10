"use client"

import { useEffect, type ReactNode } from "react"
import { SessionProvider, useSession } from "next-auth/react"

import { onAccessTokenRefreshed } from "@/lib/auth/refresh"

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

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AccessTokenRefreshListener />
      {children}
    </SessionProvider>
  )
}
