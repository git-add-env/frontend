import type { Account, NextAuthOptions, User } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GitHubProvider from "next-auth/providers/github"
import GoogleProvider from "next-auth/providers/google"

import { extractBackendAuthCookies } from "@/lib/auth/backend-cookies"
import { exchangeSocialLoginWithMeta, type AppUser, type SocialProvider } from "@/lib/auth/backend"

type TestLoginUser = User & {
  accessToken: string
  appUser: AppUser
  onboardingRequired: boolean
  backendAuthCookieHeader?: string
  backendAuthCookieNames?: string[]
}

const TEST_LOGIN_PAYLOAD = {
  provider: "google" as const,
  providerId: "test-user-001",
  email: "test-user-001@example.com",
  name: "테스트유저1",
  image: null,
}

function getProviderAccountId(account: Account) {
  return account.providerAccountId ?? account.provider
}

function isTestLoginUser(user: User): user is TestLoginUser {
  return "accessToken" in user && "appUser" in user && "onboardingRequired" in user
}

function getEnvValue(...keys: string[]) {
  return keys.map((key) => process.env[key]).find((value) => value) ?? ""
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    GoogleProvider({
      clientId: getEnvValue("GOOGLE_CLIENT_ID", "AUTH_GOOGLE_ID", "GOOGLE_ID"),
      clientSecret: getEnvValue("GOOGLE_CLIENT_SECRET", "AUTH_GOOGLE_SECRET", "GOOGLE_SECRET"),
    }),
    GitHubProvider({
      clientId: getEnvValue("GITHUB_CLIENT_ID", "AUTH_GITHUB_ID", "GITHUB_ID"),
      clientSecret: getEnvValue("GITHUB_CLIENT_SECRET", "AUTH_GITHUB_SECRET", "GITHUB_SECRET"),
    }),
    CredentialsProvider({
      id: "test-login",
      name: "Test Login",
      credentials: {},
      async authorize() {
        const result = await exchangeSocialLoginWithMeta(TEST_LOGIN_PAYLOAD)
        const backendAuthCookies = extractBackendAuthCookies(result.response.headers.get("set-cookie"))
        const loginResult = result.data

        return {
          id: String(loginResult.user.id),
          name: loginResult.user.name ?? loginResult.user.nickname ?? "테스트유저1",
          email: loginResult.user.email,
          image: loginResult.user.profileImage ?? null,
          accessToken: loginResult.accessToken,
          appUser: loginResult.user,
          onboardingRequired: loginResult.authStatus !== "LOGIN_SUCCESS",
          backendAuthCookieHeader: backendAuthCookies.cookieHeader,
          backendAuthCookieNames: backendAuthCookies.cookieNames,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile, trigger, session, user }) {
      if (trigger === "update" && session?.accessToken) {
        token.accessToken = session.accessToken
        token.onboardingRequired = session.onboardingRequired ?? token.onboardingRequired ?? false

        if (session.user) {
          token.appUser = session.user as AppUser
        }
      }

      if (account?.provider === "test-login" && user && isTestLoginUser(user)) {
        token.accessToken = user.accessToken
        token.appUser = user.appUser
        token.onboardingRequired = user.onboardingRequired
        token.email = user.appUser.email
        token.backendAuthCookieHeader = user.backendAuthCookieHeader
        token.backendAuthCookieNames = user.backendAuthCookieNames
        return token
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
        const result = await exchangeSocialLoginWithMeta({
          provider: account.provider as SocialProvider,
          providerId: getProviderAccountId(account),
          email,
          name: profile.name,
          image: "picture" in profile ? String(profile.picture ?? "") : token.picture,
        })
        const backendAuthCookies = extractBackendAuthCookies(result.response.headers.get("set-cookie"))
        const loginResult = result.data

        if (backendAuthCookies.cookieHeader) {
          token.backendAuthCookieHeader = backendAuthCookies.cookieHeader
          token.backendAuthCookieNames = backendAuthCookies.cookieNames
        }

        if (loginResult.authStatus === "LOGIN_SUCCESS") {
          token.accessToken = loginResult.accessToken
          token.appUser = loginResult.user
          token.onboardingRequired = false
          return token
        }

        token.onboardingRequired = true
        token.accessToken = loginResult.accessToken
        token.appUser = loginResult.user
        token.email = loginResult.user.email
        return token
      } catch (error) {
        console.error("[auth] backend social login failed", error)
        token.authError = "BACKEND_SOCIAL_LOGIN_FAILED"
        return token
      }
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken
      session.onboardingRequired = token.onboardingRequired
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
