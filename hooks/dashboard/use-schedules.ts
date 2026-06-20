"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { queryKeys } from "@/hooks/api/query-keys"
import type { ApiFetchError } from "@/lib/api/api-fetch"
import {
  createSchedule,
  deleteSchedule,
  fetchSchedules,
  type Schedule,
  type ScheduleInput,
} from "@/lib/api/dashboard"
import { notify } from "@/lib/notify"

export function useSchedules(meetingId: number) {
  return useQuery<{ schedules: Schedule[] }, ApiFetchError, Schedule[]>({
    queryKey: queryKeys.meetings.schedules(meetingId),
    queryFn: () => fetchSchedules(meetingId),
    select: (data) => data.schedules,
  })
}

export function useCreateSchedule(meetingId: number) {
  const queryClient = useQueryClient()

  return useMutation<Schedule, ApiFetchError, ScheduleInput>({
    mutationFn: (input) => createSchedule(meetingId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.meetings.schedules(meetingId) })
      notify.success("일정을 추가했어요")
    },
  })
}

export function useDeleteSchedule(meetingId: number) {
  const queryClient = useQueryClient()

  return useMutation<void, ApiFetchError, number>({
    mutationFn: (scheduleId) => deleteSchedule(meetingId, scheduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.meetings.schedules(meetingId) })
      notify.success("일정을 삭제했어요")
    },
  })
}
