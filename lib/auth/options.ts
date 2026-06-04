import type { Account, NextAuthOptions } from "next-auth"
import GitHubProvider from "next-auth/providers/github"
import GoogleProvider from "next-auth/providers/google"

import { exchangeSocialLogin, type AppUser, type SocialProvider } from "@/lib/auth/backend"

function getProviderAccountId(account: Account) {
  return account.providerAccountId ?? account.provider
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID ?? "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile, trigger, session }) {
      if (trigger === "update" && session?.accessToken) {
        // 온보딩 완료 후 useSession().update(...)로 받은 우리 서비스 토큰을 JWT 세션에 반영합니다.
        token.accessToken = session.accessToken
        token.onboardingRequired = false
        token.tempToken = undefined
        token.appUser = session.user as AppUser
      }

      if (!account || !profile) {
        return token
      }

      const email = profile.email

      if (!email) {
        token.authError = "SOCIAL_EMAIL_NOT_FOUND"
        return token
      }

      try {
        const result = await exchangeSocialLogin({
          provider: account.provider as SocialProvider,
          providerAccountId: getProviderAccountId(account),
          email,
          name: profile.name,
          image: "picture" in profile ? String(profile.picture ?? "") : token.picture,
        })

        if (result.status === "LOGIN_SUCCESS") {
          token.accessToken = result.accessToken
          token.refreshToken = result.refreshToken
          token.appUser = result.user
          token.onboardingRequired = false
          token.tempToken = undefined
          return token
        }

        token.onboardingRequired = true
        token.tempToken = result.tempToken
        token.email = result.email
        token.accessToken = undefined
        return token
      } catch {
        // TODO: 백엔드 에러 코드가 정리되면 세분화해서 로그인 실패 화면/토스트에 연결해주세요.
        token.authError = "BACKEND_SOCIAL_LOGIN_FAILED"
        return token
      }
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken
      session.refreshToken = token.refreshToken
      session.onboardingRequired = token.onboardingRequired
      session.tempToken = token.tempToken
      session.authError = token.authError

      if (token.appUser) {
        session.user = token.appUser
      }

      return session
    },
  },
  pages: {
    signIn: "/login",
  },
}
