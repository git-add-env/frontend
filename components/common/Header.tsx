"use client"

import Link from "next/link"
import { signOut, useSession } from "next-auth/react"
import { usePathname } from "next/navigation"

import { Button } from "@/components/ui/button"
import LoginDialog from "@/components/common/LoginDialog"
import OnboardingDialog from "@/components/common/OnboardingDialog"
import { useSyncAuthUser } from "@/hooks/use-sync-auth-user"
import { logoutBackend } from "@/lib/auth/user"
import { notify } from "@/lib/notify"
import { cn } from "@/lib/utils"

const navigationItems = [
  { label: "모임찾기", href: "/meetings" },
  { label: "상세페이지", href: "/meetings/detail" },
  { label: "대시보드", href: "/dashboard" },
  { label: "마이페이지", href: "/mypage" },
]

export default function Header() {
  const pathname = usePathname()
  const { status } = useSession()

  useSyncAuthUser()

  async function handleLogout() {
    const toastId = notify.loading("로그아웃 중입니다.")

    try {
      await logoutBackend()
      notify.success("로그아웃되었습니다.", { id: toastId })
    } catch {
      notify.warning("백엔드 로그아웃 확인은 실패했지만 세션은 종료합니다.", { id: toastId })
    } finally {
      await signOut()
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex min-h-16 w-full max-w-6xl flex-col gap-3 px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/landing" className="w-fit text-lg font-bold tracking-normal text-foreground">
          모여<span className="text-[#1abcfe]">ON</span>
        </Link>

        <nav className="flex flex-wrap items-center gap-1 text-sm">
          {navigationItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/landing" && pathname.startsWith(`${item.href}/`))

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                  isActive && "bg-accent text-accent-foreground",
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-2">
          <OnboardingDialog showTrigger={false} />
          {status === "authenticated" ? (
            <Button size="sm" variant="outline" onClick={handleLogout}>
              로그아웃
            </Button>
          ) : (
            <LoginDialog />
          )}
        </div>
      </div>
    </header>
  )
}
