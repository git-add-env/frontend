"use client"

import { useEffect, useRef } from "react"
import { useSession } from "next-auth/react"

import { Toaster } from "@/components/ui/sonner"
import { notify } from "@/lib/notify"

const LOGIN_PROVIDER_STORAGE_KEY = "auth:login-provider"

function getProviderLabel(provider: string | null) {
  if (provider === "github") {
    return "GitHub"
  }

  return "소셜 계정"
}

function getAuthErrorMessage(error: string) {
  if (error === "SOCIAL_EMAIL_NOT_FOUND") {
    return "소셜 계정에서 이메일 정보를 가져오지 못했습니다."
  }

  if (error === "BACKEND_SOCIAL_LOGIN_FAILED") {
    return "백엔드 로그인 처리 중 문제가 발생했습니다."
  }

  return "로그인 처리 중 문제가 발생했습니다."
}

function AuthToastEvents() {
  const { data: session, status } = useSession()
  const handledAuthErrorRef = useRef<string | null>(null)
  const previousStatusRef = useRef(status)

  useEffect(() => {
    const previousStatus = previousStatusRef.current
    previousStatusRef.current = status

    if (typeof window === "undefined" || status !== "authenticated") {
      return
    }

    const provider = window.sessionStorage.getItem(LOGIN_PROVIDER_STORAGE_KEY)

    if (!provider && previousStatus !== "unauthenticated") {
      return
    }

    if (provider) {
      window.sessionStorage.removeItem(LOGIN_PROVIDER_STORAGE_KEY)
    }

    if (session?.authError) {
      return
    }

    if (session?.onboardingRequired) {
      notify.info("회원가입을 마무리해주세요.", {
        description: "간단한 온보딩 정보를 입력하면 바로 시작할 수 있어요.",
      })
      return
    }

    notify.success(`${getProviderLabel(provider)} 로그인 완료`, {
      description: "다시 만나서 반가워요.",
    })
  }, [session?.authError, session?.onboardingRequired, status])

  useEffect(() => {
    if (!session?.authError || handledAuthErrorRef.current === session.authError) {
      return
    }

    handledAuthErrorRef.current = session.authError
    notify.error(getAuthErrorMessage(session.authError))
  }, [session?.authError])

  return null
}

export function rememberLoginProvider(provider: string) {
  if (typeof window === "undefined") {
    return
  }

  window.sessionStorage.setItem(LOGIN_PROVIDER_STORAGE_KEY, provider)
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <AuthToastEvents />
      <Toaster
        closeButton
        expand
        position="top-center"
        toastOptions={{
          classNames: {
            toast: "font-sans",
          },
        }}
      />
    </>
  )
}
