"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"

import { useAuthStore } from "@/stores/auth-store"

export function useSyncAuthUser() {
  const { data: session } = useSession()
  const setUser = useAuthStore((state) => state.setUser)

  useEffect(() => {
    // NextAuth 세션의 user를 Zustand에 복사해 화면 전역 상태로 쓰게 합니다.
    // accessToken은 NextAuth JWT 세션에만 두고, 요청 시 apiClient가 읽어서 헤더에 붙입니다.
    setUser(session?.user ?? null)
  }, [session?.user, setUser])
}
