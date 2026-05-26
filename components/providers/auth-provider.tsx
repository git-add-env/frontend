"use client"

import { SessionProvider } from "next-auth/react"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // NextAuth 세션 컨텍스트를 앱 전체에 제공합니다. 화면에서는 useSession/signIn/signOut을 바로 사용할 수 있습니다.
  return <SessionProvider>{children}</SessionProvider>
}
