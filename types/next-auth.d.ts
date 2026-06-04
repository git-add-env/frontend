import type { DefaultSession } from "next-auth"

import type { AppUser } from "@/lib/auth/backend"

declare module "next-auth" {
  interface Session {
    accessToken?: string
    refreshToken?: string
    onboardingRequired?: boolean
    tempToken?: string
    authError?: string
    user?: AppUser & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string
    refreshToken?: string
    onboardingRequired?: boolean
    tempToken?: string
    authError?: string
    appUser?: AppUser
  }
}
