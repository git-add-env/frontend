import { ApiFetchError } from "@/lib/api/api-fetch"

// API 실패 봉투(data)에서 사람이 읽을 메시지를 추출한다.
// 권한/비즈니스 에러는 { message }, 유효성 에러는 { 필드명: 메시지 } 형태.
export function errorMessage(e: ApiFetchError): string {
  if (e.data && typeof e.data === "object") {
    const data = e.data as Record<string, unknown>
    if (typeof data.message === "string") return data.message
    const firstField = Object.values(data).find((v) => typeof v === "string")
    if (typeof firstField === "string") return firstField
  }
  return "요청에 실패했습니다."
}
