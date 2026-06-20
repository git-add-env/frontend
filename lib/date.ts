// 날짜/시간 표시 유틸.

// 마감 표시: 오늘 마감이면 "오늘 마감", 내일 이후는 "D-N", 마감 경과 시 "마감".
// deadline은 날짜만(YYYY-MM-DD)이라 그날 끝(로컬 23:59:59)까지 모집으로 본다.
// 주의: new Date("2026-06-19")는 UTC 자정(=KST 09:00)으로 파싱되므로 직접 쓰면 안 됨.
export function formatDeadline(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number)
  const now = new Date()

  // 로컬 자정 기준 캘린더 일수 차 (오늘=0, 내일=1, 어제=-1)
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const deadlineDay = new Date(y, m - 1, d).getTime()
  const dayDiff = Math.round((deadlineDay - startOfToday) / 86_400_000)

  if (dayDiff < 0) return "마감"
  if (dayDiff > 0) return `D-${dayDiff}`

  return "오늘 마감"
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
