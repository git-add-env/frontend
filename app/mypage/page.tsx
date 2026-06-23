"use client"

import { useState } from "react"

import { BookmarkedTab } from "@/components/mypage/BookmarkedTab"
import { CompletedTab } from "@/components/mypage/CompletedTab"
import { MyMeetingsTab } from "@/components/mypage/MyMeetingsTab"
import { ProfileCard } from "@/components/mypage/ProfileCard"
import { ProfileCardSkeleton } from "@/components/mypage/ProfileCardSkeleton"
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
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "relative flex shrink-0 items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground",
                isActive && "font-semibold text-foreground",
              )}
            >
              {tab.label}
              {/* 활성 탭 밑줄 — 양끝 둥근 막대 (border-b로는 끝을 못 둥글게 함) */}
              {isActive && (
                <span className="absolute inset-x-3 -bottom-px h-[3px] rounded-full bg-brand" />
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
