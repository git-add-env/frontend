"use client"

import { Suspense, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"

import { DashboardContentSkeleton } from "@/components/dashboard/DashboardStates"
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar"
import { DashboardTabs } from "@/components/dashboard/DashboardTabs"
import { MeetingHeader } from "@/components/dashboard/MeetingHeader"
import { MembersTab } from "@/components/dashboard/MembersTab"
import { NoticesTab } from "@/components/dashboard/NoticesTab"
import { ResourceCard } from "@/components/dashboard/ResourceCard"
import { SchedulesTab } from "@/components/dashboard/SchedulesTab"
import { VideoConferenceBanner } from "@/components/dashboard/VideoConferenceBanner"
import { useMyMeetings } from "@/hooks/mypage/use-my-meetings"

type TabKey = "notices" | "schedules" | "resources" | "members"

const tabs: { key: TabKey; label: string }[] = [
  { key: "notices", label: "공지" },
  { key: "schedules", label: "일정" },
  { key: "resources", label: "참고 링크" },
  { key: "members", label: "멤버" },
]

function DashboardContent() {
  // 대시보드는 참여 중인 모임(모집중 + 활동중)을 함께 보여준다.
  // 백엔드 status 필터가 한 번에 하나라 두 번 조회 후 합친다. (완료는 제외)
  const recruiting = useMyMeetings("recruiting")
  const active = useMyMeetings("active")
  const groups = useMemo(
    () =>
      recruiting.data && active.data
        ? [...recruiting.data, ...active.data]
        : null,
    [recruiting.data, active.data]
  )
  const groupsError = recruiting.isError || active.isError
  // 사이드바(groups) 로딩 중이면 컨텐츠도 같이 스켈레톤 → 좌→우 두 번 스켈레톤 어색함 제거.
  const groupsLoading = !groups && !groupsError
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>("notices")

  // 마이페이지 "내 모임" 버튼이 ?meetingId= 로 넘긴 모임을 초기 선택으로 사용.
  // 단 내 모임 목록(groups)에 실제로 있을 때만 — 없으면 무시하고 첫 모임으로.
  const searchParams = useSearchParams()
  const meetingIdParam = Number(searchParams.get("meetingId"))
  const urlGroupId =
    meetingIdParam > 0 && groups?.some((g) => g.meetingId === meetingIdParam)
      ? meetingIdParam
      : null

  // 사용자가 아직 선택하지 않았으면(null) URL 지정 모임 → 없으면 첫 모임을 기본 선택으로 사용.
  const effectiveGroupId =
    selectedGroupId ?? urlGroupId ?? groups?.[0]?.meetingId ?? null
  const selectedGroup =
    groups?.find((g) => g.meetingId === effectiveGroupId) ?? null
  const isLeader = selectedGroup?.isLeader ?? false

  return (
    <div className="dashboard-borders mx-auto flex w-full max-w-[1280px] gap-6 px-6 py-8">
      <DashboardSidebar
        groups={groups}
        groupsError={groupsError}
        selectedId={effectiveGroupId}
        onSelect={setSelectedGroupId}
      />

      {/* min-h: 탭/항목 수에 따라 컨텐츠 높이가 들쑥거려 Footer가 움직이는 것 방지(최소 높이 고정) */}
      <section className="flex min-h-[1200px] min-w-0 flex-1 flex-col gap-4">
        {groupsLoading ? (
          <DashboardContentSkeleton />
        ) : (
          <>
            <MeetingHeader group={selectedGroup} />

            {effectiveGroupId !== null && selectedGroup && (
              <VideoConferenceBanner
                key={effectiveGroupId}
                meetingId={effectiveGroupId}
                isLeader={isLeader}
                status={selectedGroup.status}
              />
            )}

            <DashboardTabs
              tabs={tabs}
              active={activeTab}
              onChange={setActiveTab}
            />

            {effectiveGroupId === null ? (
              <p className="text-sm text-muted-foreground">
                먼저 모임을 선택해주세요.
              </p>
            ) : (
              <>
                {activeTab === "notices" && (
                  <NoticesTab
                    key={effectiveGroupId}
                    meetingId={effectiveGroupId}
                    isLeader={isLeader}
                  />
                )}
                {activeTab === "schedules" && (
                  <SchedulesTab
                    key={effectiveGroupId}
                    meetingId={effectiveGroupId}
                    isLeader={isLeader}
                  />
                )}
                {activeTab === "resources" && (
                  <ResourceCard
                    key={effectiveGroupId}
                    meetingId={effectiveGroupId}
                    isLeader={isLeader}
                  />
                )}
                {activeTab === "members" && (
                  <MembersTab
                    key={effectiveGroupId}
                    meetingId={effectiveGroupId}
                  />
                )}
              </>
            )}
          </>
        )}
      </section>
    </div>
  )
}

export default function DashboardPage() {
  // useSearchParams는 Suspense 경계 안에서 호출해야 한다(Next App Router 요구사항).
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  )
}
