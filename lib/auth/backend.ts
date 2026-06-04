export type SocialProvider = "google" | "github"

export type AppUser = {
  id: string
  email: string
  nickname?: string | null
  job?: string | null
}

export type SocialLoginPayload = {
  provider: SocialProvider
  providerAccountId: string
  email: string
  name?: string | null
  image?: string | null
}

export type ExistingMemberResponse = {
  status: "LOGIN_SUCCESS"
  accessToken: string
  refreshToken?: string
  user: AppUser
}

export type OnboardingRequiredResponse = {
  status: "ONBOARDING_REQUIRED"
  tempToken: string
  email: string
}

export type SocialLoginResponse = ExistingMemberResponse | OnboardingRequiredResponse

export type CompleteOnboardingPayload = {
  tempToken: string
  nickname: string
  job: string
}

const API_BASE_URL = process.env.BACKEND_API_URL

async function requestBackend<TResponse>(path: string, init: RequestInit) {
  if (!API_BASE_URL) {
    throw new Error("BACKEND_API_URL is not configured")
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`Backend request failed: ${response.status}`)
  }

  return response.json() as Promise<TResponse>
}

export async function exchangeSocialLogin(payload: SocialLoginPayload) {
  // TODO: 백엔드와 실제 엔드포인트/응답 필드명이 확정되면 경로와 타입을 맞춰주세요.
  // NextAuth 소셜 인증이 끝난 뒤 provider/providerAccountId/email을 백엔드로 넘겨
  // 기존 회원이면 accessToken을 받고, 첫 회원이면 온보딩용 tempToken을 받습니다.
  return requestBackend<SocialLoginResponse>("/auth/social/login", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function completeSocialOnboarding(payload: CompleteOnboardingPayload) {
  // TODO: 온보딩 저장 API 스펙 확정 후 경로/필수 입력값을 백엔드 계약에 맞춰 조정해주세요.
  // 온보딩이 끝나면 백엔드가 서비스 회원을 생성하고 최종 accessToken을 내려줍니다.
  return requestBackend<ExistingMemberResponse>("/auth/social/onboarding", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}
