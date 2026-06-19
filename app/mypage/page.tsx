"use client"

import { useState } from "react"

import { BookmarkedTab } from "@/components/mypage/BookmarkedTab"
import { CompletedTab } from "@/components/mypage/CompletedTab"
import { MyMeetingsTab } from "@/components/mypage/MyMeetingsTab"
import { ProfileCard } from "@/components/mypage/ProfileCard"
import { ProfileCardSkeleton } from "@/components/mypage/ProfileCardSkeleton"
import { useMyBookmarks } from "@/hooks/mypage/use-bookmarks"
import { useMyMeetings } from "@/hooks/mypage/use-my-meetings"
import { useMyProfile } from "@/hooks/mypage/use-profile"
import { cn } from "@/lib/utils"

type TabKey = "recruiting" | "active" | "bookmarked" | "completed"

const tabs: { key: TabKey; label: string }[] = [
  { key: "recruiting", label: "모집중" },
  { key: "active", label: "활동중" },
  { key: "bookmarked", label: "찜한 모임" },
  { key: "completed", label: "완료된 모임" },
]

export default function MyPage() {
  const { data: profile, isError: profileError } = useMyProfile()
  const [activeTab, setActiveTab] = useState<TabKey>("recruiting")

  // 탭 개수 배지용 — 탭 콘텐츠와 동일한 쿼리키라 캐시를 공유한다(중복 fetch 없음).
  const recruiting = useMyMeetings("recruiting")
  const active = useMyMeetings("active")
  const bookmarked = useMyBookmarks()
  const completed = useMyMeetings("completed")

  const counts: Record<TabKey, number | undefined> = {
    recruiting: recruiting.data?.length,
    active: active.data?.length,
    bookmarked: bookmarked.data?.length,
    completed: completed.data?.length,
  }

  return (
    <section className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 px-6 py-10">
      <header>
        <p className="text-sm font-medium text-muted-foreground">My Page</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-normal">마이페이지</h1>
      </header>

      {profileError ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          프로필을 불러오지 못했습니다.
        </p>
      ) : profile ? (
        <ProfileCard profile={profile} />
      ) : (
        <ProfileCardSkeleton />
      )}

      <div className="flex gap-1 border-b border-border">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key
          const count = counts[tab.key]
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "-mb-px flex shrink-0 items-center gap-1.5 border-b-[3px] border-transparent px-4 py-2.5 text-sm whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground",
                isActive && "border-foreground font-semibold text-foreground",
              )}
            >
              {tab.label}
              {count !== undefined && (
                <span
                  className={cn(
                    "text-xs tabular-nums",
                    isActive ? "text-foreground/60" : "text-muted-foreground/60",
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* 탭마다 콘텐츠 높이가 달라 footer가 들썩이는 걸 막기 위해 최소 높이를 확보한다. */}
      <div className="min-h-[640px]">
        {activeTab === "recruiting" && <MyMeetingsTab status="recruiting" />}
        {activeTab === "active" && <MyMeetingsTab status="active" />}
        {activeTab === "bookmarked" && <BookmarkedTab />}
        {activeTab === "completed" && <CompletedTab />}
      </div>
    </section>
  )
}
