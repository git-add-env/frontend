"use client"

import { Crown } from "lucide-react"

import type { Meeting } from "@/lib/api/mypage"
import { cn } from "@/lib/utils"

type DashboardSidebarProps = {
  groups: Meeting[] | null
  groupsError: boolean
  selectedId: number | null
  onSelect: (meetingId: number) => void
}

// 참여 중인 모임 목록 사이드바. 선택한 모임을 onSelect로 부모에 알린다.
export function DashboardSidebar({
  groups,
  groupsError,
  selectedId,
  onSelect,
}: DashboardSidebarProps) {
  return (
    <aside className="w-60 shrink-0">
      <div className="sticky top-20 flex flex-col gap-1 rounded-lg border border-border p-2">
        <p className="mb-1 border-b border-border px-3 pt-2 pb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          참여 모임
          {groups && <span className="ml-1 text-foreground">{groups.length}</span>}
        </p>

        {groupsError && (
          <p className="px-3 text-xs text-destructive">
            참여중인 모임을 불러오지 못했습니다.
          </p>
        )}
        {!groups && !groupsError && (
          <p className="px-3 text-xs text-muted-foreground">불러오는 중...</p>
        )}
        {groups && groups.length === 0 && (
          <p className="px-3 text-xs text-muted-foreground">
            참여중인 모임이 없습니다.
          </p>
        )}

        {groups?.map((group) => {
          const isActive = group.meetingId === selectedId
          return (
            <button
              key={group.meetingId}
              type="button"
              onClick={() => onSelect(group.meetingId)}
              title={group.title}
              className={cn(
                "flex items-center gap-1.5 rounded-md border border-transparent px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                isActive && "border-muted-foreground font-medium text-foreground",
              )}
            >
              {group.isLeader && (
                <Crown className="size-3.5 shrink-0 text-yellow-500" />
              )}
              {/* 긴 이름은 한 줄 말줄임(…), 전체 이름은 title 속성으로 호버 시 노출 */}
              <span className="min-w-0 flex-1 truncate">{group.title}</span>
            </button>
          )
        })}
      </div>
    </aside>
  )
}
