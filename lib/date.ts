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
