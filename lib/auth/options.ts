import type { Account, NextAuthOptions, User } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GitHubProvider from "next-auth/providers/github"
import GoogleProvider from "next-auth/providers/google"

import { exchangeSocialLogin, type AppUser, type SocialProvider } from "@/lib/auth/backend"

type TestLoginUser = User & {
  accessToken: string
  appUser: AppUser
  onboardingRequired: boolean
}

const TEST_LOGIN_PAYLOAD = {
  provider: "google" as const,
  providerId: "test-user-001",
  email: "test-user-001@example.com",
  name: "테스트유저1",
  image: "https://example.com/profile/test-user-001.png",
}

function getProviderAccountId(account: Account) {
  return account.providerAccountId ?? account.provider
}

function isTestLoginUser(user: User): user is TestLoginUser {
  return "accessToken" in user && "appUser" in user && "onboardingRequired" in user
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
    CredentialsProvider({
      id: "test-login",
      name: "Test Login",
      credentials: {},
      async authorize() {
        if (process.env.NODE_ENV === "production") {
          return null
        }

        const result = await exchangeSocialLogin(TEST_LOGIN_PAYLOAD)

        return {
          id: String(result.user.id),
          name: result.user.name ?? result.user.nickname ?? "테스트유저1",
          email: result.user.email,
          image: result.user.profileImage ?? null,
          accessToken: result.accessToken,
          appUser: result.user,
          onboardingRequired: result.authStatus !== "LOGIN_SUCCESS",
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile, trigger, session, user }) {
      if (trigger === "update" && session?.accessToken) {
        token.accessToken = session.accessToken
        token.onboardingRequired = session.onboardingRequired ?? false
        token.appUser = session.user as AppUser
      }

      if (account?.provider === "test-login" && user && isTestLoginUser(user)) {
        token.accessToken = user.accessToken
        token.appUser = user.appUser
        token.onboardingRequired = user.onboardingRequired
        token.email = user.appUser.email
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
        const result = await exchangeSocialLogin({
          provider: account.provider as SocialProvider,
          providerId: getProviderAccountId(account),
          email,
          name: profile.name,
          image: "picture" in profile ? String(profile.picture ?? "") : token.picture,
        })

        if (result.authStatus === "LOGIN_SUCCESS") {
          token.accessToken = result.accessToken
          token.appUser = result.user
          token.onboardingRequired = false
          return token
        }

        token.onboardingRequired = true
        token.accessToken = result.accessToken
        token.appUser = result.user
        token.email = result.user.email
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
