"use client"

import { Crown } from "lucide-react"
import { useEffect, useState } from "react"

import { MembersTab } from "@/components/dashboard/MembersTab"
import { OverviewTab } from "@/components/dashboard/OverviewTab"
import { SchedulesTab } from "@/components/dashboard/SchedulesTab"
import { Badge, CategoryBadge, HostBadge } from "@/components/ui/badge"
import { CATEGORY_LABEL } from "@/constants/category"
import { fetchMyMeetings, type Meeting } from "@/lib/api/mypage"
import { cn } from "@/lib/utils"

type TabKey = "overview" | "schedules" | "members"

const tabs: { key: TabKey; label: string }[] = [
  { key: "overview", label: "개요" },
  { key: "schedules", label: "일정" },
  { key: "members", label: "멤버" },
]

export default function DashboardPage() {
  const [groups, setGroups] = useState<Meeting[] | null>(null)
  const [groupsError, setGroupsError] = useState<string | null>(null)
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>("overview")

  useEffect(() => {
    fetchMyMeetings()
      .then((res) => {
        setGroups(res.meetings)
        if (res.meetings.length > 0) {
          setSelectedGroupId(res.meetings[0].meetingId)
        }
      })
      .catch(() => setGroupsError("참여중인 모임을 불러오지 못했습니다."))
  }, [])

  const selectedGroup = groups?.find((g) => g.meetingId === selectedGroupId) ?? null
  // TODO: 백엔드 MeetingSummary에 isLeader 추가되면 selectedGroup?.isLeader로 교체. 현재 임시로 모임장 취급.
  const isOwner = true

  return (
    <div className="dashboard-borders mx-auto flex w-full max-w-[1280px] gap-6 px-6 py-8">
      <aside className="w-60 shrink-0">
        <div className="sticky top-20 flex flex-col gap-1 rounded-lg border border-border p-2">
          <p className="mb-1 border-b border-border px-3 pt-2 pb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            참여 모임
            {groups && (
              <span className="ml-1 text-foreground">{groups.length}</span>
            )}
          </p>

          {groupsError && (
            <p className="px-3 text-xs text-destructive">{groupsError}</p>
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
            const isActive = group.meetingId === selectedGroupId
            return (
              <button
                key={group.meetingId}
                type="button"
                onClick={() => setSelectedGroupId(group.meetingId)}
                title={group.title}
                className={cn(
                  "flex items-center gap-1.5 rounded-md border border-transparent px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                  isActive && "border-muted-foreground font-medium text-foreground",
                )}
              >
                {/* TODO: 백엔드 isLeader 추가 시 group.isLeader && 로 교체. 현재 목록 응답에 없어 임시로 항상 표시. */}
                <Crown className="size-3.5 shrink-0 text-yellow-500" />
                {/* 긴 이름은 한 줄 말줄임(…), 전체 이름은 버튼 title 속성으로 호버 시 노출 */}
                <span className="min-w-0 flex-1 truncate">{group.title}</span>
              </button>
            )
          })}
        </div>
      </aside>

      <section className="flex flex-1 flex-col gap-4">
        <div>
          {selectedGroup && (
            <div className="mb-2 flex items-center gap-2">
              <CategoryBadge
                category={CATEGORY_LABEL[selectedGroup.category] ?? selectedGroup.category}
              />
              {/* 상태 배지: 모집중(파랑) / 활동중(초록). 완료는 표시 없음 */}
              {selectedGroup.status === "RECRUITING" && (
                <Badge variant="recruiting" className="rounded-full">
                  모집중
                </Badge>
              )}
              {selectedGroup.status === "ACTIVE" && (
                <Badge variant="active" className="rounded-full">
                  활동중
                </Badge>
              )}
              {isOwner && <HostBadge />}
            </div>
          )}
          <h1 className="text-2xl font-semibold tracking-normal">
            {selectedGroup?.title ?? "모임을 선택해주세요"}
          </h1>
        </div>

        <div className="flex gap-1 border-b border-border">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "border-b-2 border-transparent px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground",
                  isActive && "border-foreground font-medium text-foreground",
                )}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {selectedGroupId === null ? (
          <p className="text-sm text-muted-foreground">먼저 모임을 선택해주세요.</p>
        ) : (
          <>
            {activeTab === "overview" && (
              <OverviewTab
                key={selectedGroupId}
                gatheringId={selectedGroupId}
                isOwner={isOwner}
                status={selectedGroup?.status ?? ""}
              />
            )}
            {activeTab === "schedules" && (
              <SchedulesTab
                key={selectedGroupId}
                gatheringId={selectedGroupId}
                isOwner={isOwner}
              />
            )}
            {activeTab === "members" && (
              <MembersTab key={selectedGroupId} gatheringId={selectedGroupId} />
            )}
          </>
        )}
      </section>
    </div>
  )
}
