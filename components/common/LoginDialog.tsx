"use client"

import type * as React from "react"
import { useState } from "react"
import { signIn, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { rememberLoginProvider } from "@/components/providers/toast-provider"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { queryKeys } from "@/hooks/api/query-keys"
import { clearAuthScopedQueries } from "@/lib/auth/query-cache"
import { notify } from "@/lib/notify"

function GitHubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 2C6.48 2 2 6.59 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49v-1.73c-2.78.62-3.37-1.38-3.37-1.38-.45-1.19-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.34 1.12 2.91.86.09-.66.35-1.12.64-1.37-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .85-.28 2.76 1.05A9.32 9.32 0 0 1 12 6.98c.85 0 1.7.12 2.5.35 1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.79-4.57 5.05.36.32.68.94.68 1.9v2.8c0 .27.18.59.69.49A10.2 10.2 0 0 0 22 12.25C22 6.59 17.52 2 12 2Z" />
    </svg>
  )
}

type LoginDialogProps = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  showTrigger?: boolean
}

export default function LoginDialog({
  open,
  onOpenChange,
  showTrigger = true,
}: LoginDialogProps) {
  const router = useRouter()
  const { update } = useSession()
  const queryClient = useQueryClient()
  const [internalLoginOpen, setInternalLoginOpen] = useState(false)
  const [testLoginLoading, setTestLoginLoading] = useState(false)
  const loginOpen = open ?? internalLoginOpen

  function setLoginOpen(nextOpen: boolean) {
    onOpenChange?.(nextOpen)
    setInternalLoginOpen(nextOpen)
  }

  async function handleGitHubLogin() {
    try {
      rememberLoginProvider("github")
      await signIn("github")
    } catch {
      notify.error("GitHub 로그인으로 이동하지 못했습니다.")
    }
  }

  async function handleTestLogin() {
    const toastId = notify.loading("테스트 계정으로 로그인 중입니다.")
    setTestLoginLoading(true)

    try {
      const result = await signIn("test-login", { redirect: false })

      if (result?.error) throw new Error("테스트 로그인에 실패했습니다.")

      clearAuthScopedQueries(queryClient)
      await update()
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.me })
      setLoginOpen(false)
      router.refresh()
      notify.success("테스트 계정으로 로그인되었습니다.", { id: toastId })
    } catch (error) {
      notify.error(
        error instanceof Error
          ? error.message
          : "테스트 로그인에 실패했습니다.",
        { id: toastId }
      )
    } finally {
      setTestLoginLoading(false)
    }
  }

  return (
    <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
      {showTrigger ? (
        <DialogTrigger asChild>
          <Button size="sm" variant="outline">
            로그인
          </Button>
        </DialogTrigger>
      ) : null}
      <DialogContent className="max-w-sm overflow-hidden p-0">
        <div className="bg-linear-to-br from-slate-950 via-slate-900 to-slate-800 px-6 py-8 text-white">
          <DialogHeader className="text-center sm:text-center">
            <DialogTitle className="text-xl text-white">
              모여<span className="text-[#1abcfe]">ON</span> 시작하기
            </DialogTitle>
            <DialogDescription className="text-slate-300">
              개발자들과 모임을 만들고 협업을 시작해보세요.
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="space-y-3 px-6 pb-6 pt-5">
          <Button
            className="h-12 w-full gap-3 bg-[#24292f] text-white shadow-sm hover:bg-[#24292f]/90"
            onClick={handleGitHubLogin}
          >
            <GitHubIcon className="size-5" />
            GitHub로 계속하기
          </Button>
          <div className="flex items-center gap-3" aria-hidden="true">
            <span className="h-px flex-1 bg-border" />
            <span className="text-[11px] font-medium text-muted-foreground">
              또는
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full"
            onClick={handleTestLogin}
            disabled={testLoginLoading}
          >
            {testLoginLoading ? "로그인 중..." : "테스트 계정으로 로그인"}
          </Button>
          <p className="text-center text-xs leading-5 text-muted-foreground">
            로그인하면 서비스 이용약관과 개인정보 처리방침에 동의하게 됩니다.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
