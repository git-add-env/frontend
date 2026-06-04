"use client"

import type * as React from "react"
import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import OnboardingDialog from "@/components/common/OnboardingDialog"
import { rememberLoginProvider } from "@/components/providers/toast-provider"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { notify } from "@/lib/notify"

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.78-.07-1.53-.2-2.23H12v4.22h5.38a4.6 4.6 0 0 1-2 3.02v2.74h3.24c1.9-1.75 2.98-4.33 2.98-7.75z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.96-.9 6.62-2.42l-3.24-2.74c-.9.6-2.04.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.06v2.83A10 10 0 0 0 12 22z"
      />
      <path
        fill="#FBBC05"
        d="M6.41 13.68a6 6 0 0 1 0-3.36V7.49H3.06a10 10 0 0 0 0 9.02l3.35-2.83z"
      />
      <path
        fill="#EA4335"
        d="M12 6.2c1.47 0 2.79.5 3.83 1.5l2.86-2.86C16.96 3.23 14.7 2.2 12 2.2a10 10 0 0 0-8.94 5.29l3.35 2.83C7.2 7.96 9.4 6.2 12 6.2z"
      />
    </svg>
  )
}

function GitHubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 2C6.48 2 2 6.59 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49v-1.73c-2.78.62-3.37-1.38-3.37-1.38-.45-1.19-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.34 1.12 2.91.86.09-.66.35-1.12.64-1.37-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .85-.28 2.76 1.05A9.32 9.32 0 0 1 12 6.98c.85 0 1.7.12 2.5.35 1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.79-4.57 5.05.36.32.68.94.68 1.9v2.8c0 .27.18.59.69.49A10.2 10.2 0 0 0 22 12.25C22 6.59 17.52 2 12 2Z" />
    </svg>
  )
}

export default function LoginDialog() {
  const router = useRouter()
  const [loginOpen, setLoginOpen] = useState(false)
  const [onboardingPreviewOpen, setOnboardingPreviewOpen] = useState(false)
  const [testLoginLoading, setTestLoginLoading] = useState(false)
  const testLoginEnabled = process.env.NODE_ENV !== "production"

  function openOnboardingPreview() {
    setLoginOpen(false)
    setOnboardingPreviewOpen(true)
  }

  async function handleSocialLogin(provider: "google" | "github") {
    try {
      rememberLoginProvider(provider)
      await signIn(provider)
    } catch {
      notify.error("소셜 로그인으로 이동하지 못했습니다.")
    }
  }

  async function handleTestLogin() {
    const toastId = notify.loading("테스트 계정으로 로그인 중입니다.")
    setTestLoginLoading(true)

    try {
      const result = await signIn("test-login", {
        redirect: false,
      })

      if (result?.error) throw new Error("테스트 로그인에 실패했습니다.")

      setLoginOpen(false)
      router.refresh()
      notify.success("테스트 계정으로 로그인되었습니다.", { id: toastId })
    } catch (error) {
      notify.error(error instanceof Error ? error.message : "테스트 로그인에 실패했습니다.", {
        id: toastId,
      })
    } finally {
      setTestLoginLoading(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              로그인
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>로그인</DialogTitle>
              <DialogDescription>소셜 계정으로 모임찾기를 시작하세요.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-3">
              <Button
                variant="outline"
                className="h-11 justify-start gap-3 px-4"
                onClick={() => handleSocialLogin("google")}
              >
                <span className="flex size-6 items-center justify-center rounded-full bg-white shadow-xs ring-1 ring-border">
                  <GoogleIcon className="size-4" />
                </span>
                Google로 로그인
              </Button>
              <Button
                variant="outline"
                className="h-11 justify-start gap-3 px-4"
                onClick={() => handleSocialLogin("github")}
              >
                <span className="flex size-6 items-center justify-center rounded-full bg-foreground text-background">
                  <GitHubIcon className="size-4" />
                </span>
                GitHub로 로그인
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="mt-1 h-10"
                onClick={openOnboardingPreview}
              >
                온보딩 미리보기
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {testLoginEnabled ? (
          <Button
            size="sm"
            variant="secondary"
            onClick={handleTestLogin}
            disabled={testLoginLoading}
          >
            {testLoginLoading ? "로그인 중" : "테스트 로그인"}
          </Button>
        ) : null}
      </div>

      <OnboardingDialog
        open={onboardingPreviewOpen}
        onOpenChange={setOnboardingPreviewOpen}
        previewMode
        showTrigger={false}
      />
    </>
  )
}
