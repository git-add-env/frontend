"use client"

import { useEffect, useMemo } from "react"

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Crown, GripVertical } from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import { CATEGORY_LABEL } from "@/constants/category"
import type { Meeting } from "@/lib/api/mypage"
import { sortBySavedOrder, useMeetingOrderStore } from "@/stores/meeting-order-store"
import { cn } from "@/lib/utils"

type DashboardSidebarProps = {
  groups: Meeting[] | null
  groupsError: boolean
  selectedId: number | null
  onSelect: (meetingId: number) => void
}

// 상태별 섹션: 라벨 + 왼쪽 세로 바 색. 배열 순서가 곧 렌더 순서(활동중 → 모집중).
const SECTIONS = [
  { status: "ACTIVE", label: "활동중", accentClass: "bg-green-500" },
  { status: "RECRUITING", label: "모집중", accentClass: "bg-red-300" },
] as const

// 참여 중인 모임 목록 사이드바. 모집중/활동중 두 섹션으로 나눠 보여주고,
// 각 섹션 안에서 드래그로 순서를 바꿀 수 있다(localStorage 저장). 선택은 onSelect로 부모에 알린다.
export function DashboardSidebar({
  groups,
  groupsError,
  selectedId,
  onSelect,
}: DashboardSidebarProps) {
  const orderedIds = useMeetingOrderStore((state) => state.orderedIds)
  const setOrderedIds = useMeetingOrderStore((state) => state.setOrderedIds)

  // 삭제/탈퇴/종료로 목록에서 빠진 모임 id를 localStorage 순서 배열에서도 제거(위생).
  // pruned 길이가 다를 때만 set → 무한 루프 없음.
  useEffect(() => {
    if (!groups) return
    const valid = new Set(groups.map((group) => group.meetingId))
    const pruned = orderedIds.filter((id) => valid.has(id))
    if (pruned.length !== orderedIds.length) setOrderedIds(pruned)
  }, [groups, orderedIds, setOrderedIds])

  // 섹션별로 나누고 저장된 순서로 정렬. groups/orderedIds 바뀔 때만 재계산.
  const sectioned = useMemo(() => {
    return SECTIONS.map((section) => ({
      ...section,
      items: sortBySavedOrder(
        (groups ?? []).filter((group) => group.status === section.status),
        orderedIds,
      ),
    }))
  }, [groups, orderedIds])

  const sensors = useSensors(
    // distance 5: 살짝 누르고 떼는 '클릭(선택)'과 '드래그'를 구분.
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeId = Number(active.id)
    const overId = Number(over.id)

    // active가 속한 섹션 찾기. over가 같은 섹션이 아니면 무시(섹션 간 이동 금지).
    const section = sectioned.find((s) => s.items.some((g) => g.meetingId === activeId))
    if (!section || !section.items.some((g) => g.meetingId === overId)) return

    const ids = section.items.map((g) => g.meetingId)
    const reordered = arrayMove(ids, ids.indexOf(activeId), ids.indexOf(overId))

    // 전체 순서 재구성: 섹션 순서대로 평탄화하되, 방금 바꾼 섹션만 새 순서로 교체.
    const fullOrder = sectioned.flatMap((s) =>
      s.status === section.status ? reordered : s.items.map((g) => g.meetingId),
    )
    setOrderedIds(fullOrder)
  }

  return (
    <aside className="w-64 shrink-0">
      <div className="sticky top-20 flex flex-col gap-4 rounded-lg border border-border p-2 pt-4">
        {groupsError && (
          <p className="px-3 py-2 text-xs text-destructive">
            참여중인 모임을 불러오지 못했습니다.
          </p>
        )}
        {!groups && !groupsError && (
          <div className="flex flex-col gap-2 px-1 py-1" aria-hidden>
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        )}
        {groups && groups.length === 0 && (
          <p className="px-3 py-2 text-xs text-muted-foreground">
            참여중인 모임이 없습니다.
          </p>
        )}

        {groups && groups.length > 0 && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            {sectioned.map(({ status, label, accentClass, items }) => (
              <section key={status} className="flex flex-col gap-1">
                {/* 섹션 헤더: 왼쪽 세로 컬러 바 + 라벨 + 구분선 + 개수 */}
                <div className="flex items-center gap-2 px-3 py-1">
                  <span className={cn("h-4 w-1 shrink-0 rounded-full", accentClass)} />
                  <span className="shrink-0 text-[13px] font-bold text-foreground">{label}</span>
                  <span className="h-px flex-1 bg-border" />
                  <span className="shrink-0 text-xs font-bold text-muted-foreground">{items.length}</span>
                </div>

                {items.length === 0 ? (
                  <p className="px-3 py-1 text-xs text-muted-foreground/70">
                    {label}인 모임이 없습니다.
                  </p>
                ) : (
                  <SortableContext
                    items={items.map((g) => g.meetingId)}
                    strategy={verticalListSortingStrategy}
                  >
                    {items.map((group) => (
                      <SortableItem
                        key={group.meetingId}
                        group={group}
                        isActive={group.meetingId === selectedId}
                        onSelect={onSelect}
                      />
                    ))}
                  </SortableContext>
                )}
              </section>
            ))}
          </DndContext>
        )}
      </div>
    </aside>
  )
}

type SortableItemProps = {
  group: Meeting
  isActive: boolean
  onSelect: (meetingId: number) => void
}

function SortableItem({ group, isActive, onSelect }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: group.meetingId,
  })
  const { currentCount, totalCount } = group.recruitSummary

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center rounded-lg transition-colors",
        // 선택: 테두리/그림자 없이 회색 배경으로 표시(hover는 배경 대신 제목 굵기로 강조).
        isActive && "bg-accent",
        // 드래그 중인 항목은 위로 떠오르고 반투명.
        isDragging && "z-10 opacity-60",
      )}
    >
      {/* 드래그 핸들: 평소엔 숨기고 hover/포커스/드래그 중에만 노출. 이 영역에서만 드래그 시작. */}
      <button
        type="button"
        className={cn(
          "flex h-full cursor-grab touch-none items-center px-1 text-muted-foreground/50 opacity-0 transition-opacity hover:text-muted-foreground focus-visible:opacity-100 group-hover:opacity-100 active:cursor-grabbing",
          isDragging && "opacity-100",
        )}
        aria-label="순서 변경"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>

      <button
        type="button"
        onClick={() => onSelect(group.meetingId)}
        title={group.title}
        className="flex min-w-0 flex-1 flex-col gap-1 py-2 pr-3 text-left"
      >
        {/* 제목 줄: 이름(말줄임) + 우측에 모임장 왕관 아이콘. 전체 이름은 title 속성으로 호버 시 노출 */}
        <span className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              "truncate text-sm font-semibold text-foreground group-hover:font-bold",
              isActive && "font-bold",
            )}
          >
            {group.title}
          </span>
          {group.isLeader && (
            <span className="ml-auto flex size-4 shrink-0 items-center justify-center rounded-full bg-yellow-100 text-yellow-500">
              <Crown className="size-3" />
            </span>
          )}
        </span>
        <span
          className={cn(
            "flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground group-hover:font-bold",
            isActive && "font-bold",
          )}
        >
          <span className="shrink-0">{CATEGORY_LABEL[group.category] ?? group.category}</span>
          <span className="shrink-0">
            · {currentCount}/{totalCount}명
          </span>
        </span>
      </button>
    </div>
  )
}
