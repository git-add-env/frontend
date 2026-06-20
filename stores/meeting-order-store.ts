import { create } from "zustand"
import { persist } from "zustand/middleware"

// 대시보드 사이드바 모임 정렬 순서(사용자 드래그). localStorage에 저장돼 새로고침해도 유지된다.
// orderedIds = 사용자가 정한 전체 표시 순서(섹션 무관 평탄화). 목록에 없는 새 모임은 맨 뒤로.
type MeetingOrderState = {
  orderedIds: number[]
  setOrderedIds: (ids: number[]) => void
}

export const useMeetingOrderStore = create<MeetingOrderState>()(
  persist(
    (set) => ({
      orderedIds: [],
      setOrderedIds: (orderedIds) => set({ orderedIds }),
    }),
    { name: "dashboard-meeting-order" },
  ),
)

// 저장된 순서로 정렬(안정 정렬). 저장 목록에 없는 항목(신규 모임)은 원래 순서 유지하며 맨 뒤로.
export function sortBySavedOrder<T extends { meetingId: number }>(
  items: T[],
  orderedIds: number[],
): T[] {
  const rank = new Map(orderedIds.map((id, index) => [id, index]))
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const ra = rank.get(a.item.meetingId) ?? Number.POSITIVE_INFINITY
      const rb = rank.get(b.item.meetingId) ?? Number.POSITIVE_INFINITY
      return ra === rb ? a.index - b.index : ra - rb
    })
    .map(({ item }) => item)
}
