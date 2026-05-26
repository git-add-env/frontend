import { create } from "zustand"

import type { AppUser } from "@/lib/auth/backend"

type AuthState = {
  user: AppUser | null
  setUser: (user: AppUser | null) => void
  clearUser: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  // Zustand는 토큰 저장소가 아니라 화면에서 자주 쓰는 현재 유저 정보를 공유하는 용도로만 사용합니다.
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}))
