import type { Schedule } from "@/lib/api/dashboard"

// 화상 회의(isMeeting) 일정 중 가장 가까운 미래 일정.
export function findNextMeeting(schedules: Schedule[]): Schedule | null {
  const now = Date.now()
  const upcoming = schedules
    .filter((s) => s.isMeeting)
    .map((s) => ({ s, at: new Date(`${s.date}T${s.time}:00`).getTime() }))
    .filter(({ at }) => Number.isFinite(at) && at >= now)
    .sort((a, b) => a.at - b.at)
  return upcoming[0]?.s ?? null
}
