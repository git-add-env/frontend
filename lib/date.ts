// 날짜/시간 표시 유틸.

// 마감 표시: 하루 미만은 "N시간 남음", 하루 이상은 "D-N", 마감 경과 시 "마감".
export function formatDeadline(iso: string): string {
  const target = new Date(iso).getTime()
  const now = Date.now()
  const diffMs = target - now

  if (diffMs <= 0) return "마감"

  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  if (hours < 24) return `${hours}시간 남음`

  const days = Math.ceil(hours / 24)
  return `D-${days}`
}

// 일정 날짜를 "2026.05.28 (수)" 형태로 변환.
export function formatMeetingDate(date: string): string {
  const d = new Date(`${date}T00:00:00`)
  if (Number.isNaN(d.getTime())) return date
  const week = ["일", "월", "화", "수", "목", "금", "토"]
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}.${m}.${day} (${week[d.getDay()]})`
}
