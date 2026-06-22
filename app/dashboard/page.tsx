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

// 새로고침해도 마지막으로 본 모임을 유지하기 위한 localStorage 키.
const SELECTED_MEETING_KEY = "dashboard:selectedMeetingId"

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

  // 새로고침 시 마지막 선택 모임 복원. lazy 초기화로 localStorage를 1회만 읽는다.
  // (선택 UI는 groups 로드 후에만 그려져서 SSR(null)/클라 첫 렌더가 동일 → 하이드레이션 안전)
  const [storedGroupId] = useState<number | null>(() => {
    if (typeof window === "undefined") return null
    try {
      const id = Number(localStorage.getItem(SELECTED_MEETING_KEY))
      return id > 0 ? id : null
    } catch {
      return null
    }
  })

  // 모임 선택 시 상태 + localStorage 동시 갱신.
  function handleSelect(meetingId: number) {
    setSelectedGroupId(meetingId)
    try {
      localStorage.setItem(SELECTED_MEETING_KEY, String(meetingId))
    } catch {
      /* 저장 실패는 무시 (선택 자체는 동작) */
    }
  }

  // 마이페이지 "내 모임" 버튼이 ?meetingId= 로 넘긴 모임을 초기 선택으로 사용.
  // 단 내 모임 목록(groups)에 실제로 있을 때만 — 없으면 무시하고 첫 모임으로.
  const searchParams = useSearchParams()
  const meetingIdParam = Number(searchParams.get("meetingId"))
  const urlGroupId =
    meetingIdParam > 0 && groups?.some((g) => g.meetingId === meetingIdParam)
      ? meetingIdParam
      : null

  // 세션 클릭값도 현재 목록에 있을 때만 사용 — 클릭 후 목록 갱신(탈퇴/삭제/완료)으로
  // stale id가 남으면 존재하지 않는 meetingId가 탭 컴포넌트로 전달되는 것을 방지.
  const validSelectedId =
    selectedGroupId && groups?.some((g) => g.meetingId === selectedGroupId)
      ? selectedGroupId
      : null

  // 저장된 모임도 현재 내 목록에 있을 때만 사용 (탈퇴·삭제된 id는 무시).
  const validStoredId =
    storedGroupId && groups?.some((g) => g.meetingId === storedGroupId)
      ? storedGroupId
      : null

  // 선택 우선순위: 이번 세션 클릭 → URL 지정(마이페이지 진입) → 저장된 마지막 선택 → 첫 모임.
  const effectiveGroupId =
    validSelectedId ??
    urlGroupId ??
    validStoredId ??
    groups?.[0]?.meetingId ??
    null
  const selectedGroup =
    groups?.find((g) => g.meetingId === effectiveGroupId) ?? null
  const isLeader = selectedGroup?.isLeader ?? false

  return (
    <div className="dashboard-borders mx-auto flex w-full max-w-[1280px] gap-6 px-6 py-8">
      <DashboardSidebar
        groups={groups}
        groupsError={groupsError}
        selectedId={effectiveGroupId}
        onSelect={handleSelect}
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
