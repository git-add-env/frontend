import type { DefaultSession } from "next-auth"

import type { AppUser } from "@/lib/auth/backend"

declare module "next-auth" {
  interface Session {
    accessToken?: string
    onboardingRequired?: boolean
    authError?: string
    user?: AppUser & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string
    onboardingRequired?: boolean
    authError?: string
    appUser?: AppUser
    backendAuthCookieHeader?: string
    backendAuthCookieNames?: string[]
  }
}
