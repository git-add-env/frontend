"use client"

import Link from "next/link"
import { signOut, useSession } from "next-auth/react"
import { usePathname, useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { User } from "lucide-react"

import { Button } from "@/components/ui/button"
import LoginDialog from "@/components/common/LoginDialog"
import { NotificationBell } from "@/components/common/NotificationBell"
import OnboardingDialog from "@/components/common/OnboardingDialog"
import { useSyncAuthUser } from "@/hooks/use-sync-auth-user"
import { clearAuthScopedQueries } from "@/lib/auth/query-cache"
import { logoutBackend } from "@/lib/auth/user"
import { notify } from "@/lib/notify"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/stores/auth-store"

const navigationItems = [
  { label: "모임찾기", href: "/meetings" },
  { label: "내 모임", href: "/dashboard", authOnly: true },
]

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { status } = useSession()
  const queryClient = useQueryClient()
  const clearUser = useAuthStore((state) => state.clearUser)

  useSyncAuthUser()

  async function handleLogout() {
    const toastId = notify.loading("로그아웃 중입니다.")
    clearUser()
    clearAuthScopedQueries(queryClient)

    try {
      await logoutBackend()
      notify.success("로그아웃되었습니다.", { id: toastId })
    } catch {
      notify.warning("백엔드 로그아웃 확인은 실패했지만 세션은 종료합니다.", {
        id: toastId,
      })
    } finally {
      await signOut({ redirect: false })
      router.refresh()
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-18 w-full max-w-[1280px] items-center justify-between px-6">
        {/* 왼쪽: 로고 + 내비게이션 */}
        <div className="flex items-center gap-8">
          <Link
            href="/landing"
            className="inline-flex items-start gap-1 text-lg font-bold tracking-normal text-foreground"
          >
            <span>
              모여<span className="text-[#1abcfe]">ON</span>
            </span>
            <span
              className="mt-1 size-1.5 rounded-full bg-[#1abcfe]"
              aria-hidden="true"
            />
          </Link>

          <nav className="flex items-center gap-1 text-sm">
            {navigationItems
              .filter((item) => !item.authOnly || status === "authenticated")
              .map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/landing" &&
                    pathname.startsWith(`${item.href}/`))

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "rounded-md px-3 py-2 font-semibold text-muted-foreground transition-colors hover:text-[#1abcfe]",
                      isActive && "text-foreground"
                    )}
                  >
                    {item.label}
                  </Link>
                )
              })}
          </nav>
        </div>

        {/* 오른쪽: 로그인 상태에 따라 분기 */}
        <div className="flex items-center gap-2">
          <OnboardingDialog showTrigger={false} />
          {status === "authenticated" ? (
            <>
              {/* 알림 벨 — 팝오버 + SSE 수신 */}
              <NotificationBell />
              {/* 프로필 → 마이페이지 */}
              <Link
                href="/mypage"
                aria-label="마이페이지"
                className="flex size-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-accent"
              >
                <User className="size-[18px]" />
              </Link>
              <Button size="sm" variant="outline" onClick={handleLogout}>
                로그아웃
              </Button>
            </>
          ) : (
            <LoginDialog />
          )}
        </div>
      </div>
    </header>
  )
}
