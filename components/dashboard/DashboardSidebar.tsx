"use client"

import { useEffect, useMemo, useState } from "react"

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
import {
  Check,
  ChevronDown,
  Crown,
  FolderGit2,
  GripVertical,
  Trophy,
  Zap,
  type LucideIcon,
} from "lucide-react"

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

// 상태별 섹션: 라벨 + 왼쪽 세로 바/점 색. 배열 순서가 곧 렌더 순서(활동중 → 모집중).
const SECTIONS = [
  { status: "ACTIVE", label: "활동중", accentClass: "bg-green-500" },
  { status: "RECRUITING", label: "모집중", accentClass: "bg-red-400" },
] as const

// 카테고리별 썸네일 그라데이션 + 아이콘 (thumbnailUrl 없을 때의 플레이스홀더).
const CATEGORY_THUMB: Record<string, { gradient: string; Icon: LucideIcon }> = {
  PROJECT: { gradient: "from-indigo-500 to-violet-500", Icon: FolderGit2 },
  HACKATHON: { gradient: "from-orange-500 to-pink-500", Icon: Zap },
  CONTEST: { gradient: "from-teal-400 to-sky-500", Icon: Trophy },
}

type Sectioned = {
  status: string
  label: string
  accentClass: string
  items: Meeting[]
}[]

// 참여 중인 모임 목록 사이드바. 모집중/활동중 두 섹션으로 나눠 보여주고,
// 각 섹션 안에서 드래그로 순서를 바꿀 수 있다(localStorage 저장). 선택은 onSelect로 부모에 알린다.
// 데스크탑(lg+)은 좌측 고정 사이드바, 좁은 화면은 상단 드롭다운으로 전환된다.
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
  const sectioned: Sectioned = useMemo(() => {
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
    <>
      {/* 좁은 화면: 상단 드롭다운 */}
      <MobileMeetingDropdown
        sectioned={sectioned}
        selectedId={selectedId}
        onSelect={onSelect}
        groupsError={groupsError}
        loading={!groups && !groupsError}
        hasGroups={!!groups && groups.length > 0}
      />

      {/* 데스크탑(lg+): 좌측 고정 사이드바 */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-20 flex flex-col gap-4 rounded-lg border border-border p-2 pt-4">
          {groupsError && (
            <p className="px-3 py-2 text-xs text-destructive">
              참여중인 모임을 불러오지 못했습니다.
            </p>
          )}
          {!groups && !groupsError && (
            <div role="status" className="flex flex-col gap-2 px-1 py-1">
              <span className="sr-only">참여 모임 불러오는 중</span>
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
                  {/* 섹션 헤더: 배경 없이 상태 점 + 라벨 + 오른쪽 개수 배지(데스크탑은 배경 블록 제거) */}
                  <div className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-muted-foreground">
                    <span className={cn("size-2 shrink-0 rounded-full", accentClass)} />
                    {label}
                    <CountBadge count={items.length} className="ml-auto" />
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
    </>
  )
}

// 카테고리 썸네일 (없으면 그라데이션 + 아이콘). className으로 크기 지정.
function MeetingThumb({
  meeting,
  className,
}: {
  meeting: Meeting
  className?: string
}) {
  const { gradient, Icon } = CATEGORY_THUMB[meeting.category] ?? {
    gradient: "from-slate-400 to-slate-500",
    Icon: FolderGit2,
  }
  return (
    <div className={cn("shrink-0 overflow-hidden rounded-xl", className)}>
      {meeting.thumbnailUrl ? (
        // 임의 S3 URL이라 next/image 도메인 설정을 피하려고 raw img 사용
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={meeting.thumbnailUrl}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : (
        <div
          className={cn(
            "flex h-full w-full items-center justify-center bg-linear-to-br text-white",
            gradient,
          )}
        >
          <Icon className="size-5" />
        </div>
      )}
    </div>
  )
}

// 모임 항목의 공통 비주얼: 썸네일 + (제목 + 모임장 왕관) + 카테고리·인원 메타.
// 데스크탑 사이드바와 모바일 드롭다운이 동일한 카드 모양을 쓰도록 추출(디자인 통일).
// 바깥(선택 배경·드래그 핸들·체크 아이콘)은 각 컨텍스트가 감싼다.
function MeetingCardBody({
  meeting,
  thumbClassName,
}: {
  meeting: Meeting
  thumbClassName?: string
}) {
  const { currentCount, totalCount } = meeting.recruitSummary
  return (
    <>
      <MeetingThumb meeting={meeting} className={cn("size-10", thumbClassName)} />
      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="truncate text-sm font-bold text-foreground">{meeting.title}</span>
          {meeting.isLeader && (
            <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-yellow-100 text-yellow-500">
              <Crown className="size-3" />
            </span>
          )}
        </span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
          {CATEGORY_LABEL[meeting.category] ?? meeting.category} ·{" "}
          {currentCount}/{totalCount}명
        </span>
      </span>
    </>
  )
}

// 섹션 개수 배지: 동그란 pill 안에 숫자. 데스크탑·모바일 섹션 헤더 공통.
function CountBadge({ count, className }: { count: number; className?: string }) {
  return (
    <span
      className={cn(
        "flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-muted px-1.5 text-xs font-bold text-muted-foreground",
        className,
      )}
    >
      {count}
    </span>
  )
}

type MobileMeetingDropdownProps = {
  sectioned: Sectioned
  selectedId: number | null
  onSelect: (meetingId: number) => void
  groupsError: boolean
  loading: boolean
  hasGroups: boolean
}

function MobileMeetingDropdown({
  sectioned,
  selectedId,
  onSelect,
  groupsError,
  loading,
  hasGroups,
}: MobileMeetingDropdownProps) {
  const [open, setOpen] = useState(false)
  const allItems = sectioned.flatMap((s) => s.items)
  const selected = allItems.find((g) => g.meetingId === selectedId) ?? null
  const selectedSection = selected
    ? sectioned.find((s) => s.status === selected.status)
    : null

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={!hasGroups}
        aria-expanded={open}
        className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-sm disabled:cursor-not-allowed"
      >
        {selected ? (
          <>
            <MeetingThumb meeting={selected} className="size-11" />
            <span className="min-w-0 flex-1 text-left">
              <span className="flex items-center gap-1.5">
                {selectedSection && (
                  <span
                    className={cn(
                      "size-2 shrink-0 rounded-full",
                      selectedSection.accentClass,
                    )}
                  />
                )}
                <span className="truncate text-sm font-bold">{selected.title}</span>
              </span>
              <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                {CATEGORY_LABEL[selected.category] ?? selected.category} ·{" "}
                {selected.recruitSummary.currentCount}/
                {selected.recruitSummary.totalCount}명 · {selectedSection?.label}
              </span>
            </span>
          </>
        ) : (
          <span className="flex-1 text-left text-sm text-muted-foreground">
            {groupsError
              ? "모임을 불러오지 못했습니다."
              : loading
                ? "불러오는 중..."
                : "참여중인 모임이 없습니다."}
          </span>
        )}
        <ChevronDown
          className={cn(
            "size-5 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && hasGroups && (
        <div className="mt-2 overflow-hidden rounded-xl border border-border">
          {sectioned.map((section) => (
            <div key={section.status}>
              <div className="flex items-center gap-2 bg-muted/40 px-4 py-2 text-xs font-bold text-muted-foreground">
                <span
                  className={cn("size-2 shrink-0 rounded-full", section.accentClass)}
                />
                {section.label}
                <CountBadge count={section.items.length} className="ml-auto" />
              </div>
              {section.items.length === 0 ? (
                <p className="border-t border-border px-4 py-3 text-xs text-muted-foreground/70">
                  {section.label}인 모임이 없습니다.
                </p>
              ) : (
                section.items.map((group) => {
                  const isActive = group.meetingId === selectedId
                  return (
                    <button
                      key={group.meetingId}
                      type="button"
                      onClick={() => {
                        onSelect(group.meetingId)
                        setOpen(false)
                      }}
                      className={cn(
                        "flex w-full items-center gap-3 border-t border-border px-4 py-3 text-left transition-colors",
                        isActive ? "bg-blue-50" : "hover:bg-muted/40",
                      )}
                    >
                      <MeetingCardBody meeting={group} />
                      {isActive && (
                        <Check className="size-4 shrink-0 text-blue-500" />
                      )}
                    </button>
                  )
                })
              )}
            </div>
          ))}
        </div>
      )}
    </div>
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
        // 선택: 테두리/그림자 없이 연한 하늘색 배경. 비선택은 hover 시 옅은 배경(모바일과 통일).
        isActive ? "bg-blue-50" : "hover:bg-muted/40",
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
        className="flex min-w-0 flex-1 items-center gap-3 py-2 pr-3 text-left"
      >
        <MeetingCardBody meeting={group} />
      </button>
    </div>
  )
}
