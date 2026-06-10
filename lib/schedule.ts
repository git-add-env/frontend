import type { Schedule } from "@/lib/api/dashboard"

// 일정의 date(YYYY-MM-DD) + time(HH:MM)을 타임스탬프로 변환. 파싱 실패 시 NaN.
function scheduleTime(schedule: Schedule): number {
  return new Date(`${schedule.date}T${schedule.time}:00`).getTime()
}

// 화상 회의(isMeeting) 일정 중 가장 가까운 미래 일정.
export function findNextMeeting(schedules: Schedule[]): Schedule | null {
  const now = Date.now()
  const upcoming = schedules
    .filter((s) => s.isMeeting)
    .map((s) => ({ s, at: scheduleTime(s) }))
    .filter(({ at }) => Number.isFinite(at) && at >= now)
    .sort((a, b) => a.at - b.at)
  return upcoming[0]?.s ?? null
}

export type SplitSchedules = {
  upcoming: Schedule[] // 예정: 가까운 순
  past: Schedule[] // 지난: 최근 순
}

// 현재 시각 기준으로 일정을 예정/지난으로 분리한다.
// 날짜+시간 파싱이 안 되는 일정은 예정으로 취급해 목록에서 누락되지 않게 한다.
export function splitSchedules(schedules: Schedule[]): SplitSchedules {
  const now = Date.now()
  const withTime = schedules.map((s) => ({ s, at: scheduleTime(s) }))
  const upcoming = withTime
    .filter(({ at }) => !Number.isFinite(at) || at >= now)
    .sort((a, b) => a.at - b.at)
    .map(({ s }) => s)
  const past = withTime
    .filter(({ at }) => Number.isFinite(at) && at < now)
    .sort((a, b) => b.at - a.at)
    .map(({ s }) => s)
  return { upcoming, past }
}
