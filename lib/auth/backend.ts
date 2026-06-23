import { apiFetch, apiFetchWithMeta } from "@/lib/api/api-fetch"

export type SocialProvider = "google" | "github"

export type AppUser = {
  id: number | string
  email: string
  name?: string | null
  nickname?: string | null
  job?: string | null
  career?: string | null
  techStacks?: string[]
  introduction?: string | null
  profileImage?: string | null
  profileImageUrl?: string | null
  createdAt?: string
  updatedAt?: string
}

export type SocialLoginPayload = {
  provider: SocialProvider
  providerId: string
  email: string
  name?: string | null
  image?: string | null
}

export type ExistingMemberResponse = {
  authStatus: "LOGIN_SUCCESS"
  isNewUser: false
  accessToken: string
  user: AppUser
}

export type OnboardingRequiredResponse = {
  authStatus: "ONBOARDING_REQUIRED"
  isNewUser: true
  accessToken: string
  user: AppUser
}

export type SocialLoginResponse = ExistingMemberResponse | OnboardingRequiredResponse

export type CompleteOnboardingPayload = {
  nickname: string
  job: string
  career: string
  techStacks: string[]
  introduction?: string | null
}

export type CompleteOnboardingResponse = {
  authStatus: "LOGIN_SUCCESS"
  isNewUser: true
  accessToken?: string
  user: AppUser
}

const API_BASE_URL = process.env.BACKEND_API_URL
const SOCIAL_LOGIN_PATH = "/api/auth/social-login"
const SOCIAL_ONBOARDING_PATH = "/api/auth/onboarding"

async function requestBackend<TResponse>(path: string, init: RequestInit) {
  if (!API_BASE_URL) {
    throw new Error("BACKEND_API_URL is not configured")
  }

  return apiFetch<TResponse>(path, {
    ...init,
    baseUrl: API_BASE_URL,
    cache: "no-store",
  })
}

async function requestBackendWithMeta<TResponse>(path: string, init: RequestInit) {
  if (!API_BASE_URL) {
    throw new Error("BACKEND_API_URL is not configured")
  }

  return apiFetchWithMeta<TResponse>(path, {
    ...init,
    baseUrl: API_BASE_URL,
    cache: "no-store",
  })
}

export async function exchangeSocialLogin(payload: SocialLoginPayload) {
  return requestBackend<SocialLoginResponse>(SOCIAL_LOGIN_PATH, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function exchangeSocialLoginWithMeta(payload: SocialLoginPayload) {
  return requestBackendWithMeta<SocialLoginResponse>(SOCIAL_LOGIN_PATH, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function completeSocialOnboarding(
  accessToken: string,
  payload: CompleteOnboardingPayload,
) {
  return requestBackend<CompleteOnboardingResponse>(SOCIAL_ONBOARDING_PATH, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  })
}

export async function completeSocialOnboardingWithMeta(
  accessToken: string,
  payload: CompleteOnboardingPayload,
) {
  return requestBackendWithMeta<CompleteOnboardingResponse>(SOCIAL_ONBOARDING_PATH, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  })
}
