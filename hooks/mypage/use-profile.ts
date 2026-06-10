"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { queryKeys } from "@/hooks/api/query-keys"
import type { ApiFetchError } from "@/lib/api/api-fetch"
import { fetchMyProfile, patchMyProfile, type Profile, type ProfilePatch } from "@/lib/api/mypage"

export function useMyProfile() {
  return useQuery<Profile, ApiFetchError>({
    queryKey: queryKeys.profile.me,
    queryFn: fetchMyProfile,
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation<Profile, ApiFetchError, ProfilePatch>({
    mutationFn: patchMyProfile,
    onSuccess: (profile) => {
      // 응답이 갱신된 프로필 전체라 캐시에 바로 반영하고, 헤더(auth.me)도 무효화.
      queryClient.setQueryData(queryKeys.profile.me, profile)
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me })
    },
  })
}
