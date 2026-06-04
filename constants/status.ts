// 모임 상태 enum → 한글 라벨 / 상태 배지 variant
export const STATUS_LABEL: Record<string, string> = {
  RECRUITING: "모집중",
  ACTIVE: "활동중",
  COMPLETED: "완료",
}

export const STATUS_BADGE_VARIANT: Record<string, "recruiting" | "active" | "deadline"> = {
  RECRUITING: "recruiting",
  ACTIVE: "active",
  COMPLETED: "deadline",
}
