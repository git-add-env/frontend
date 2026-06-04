"use client"

import { useEffect, useState } from "react"

import { BookmarkedTab } from "@/components/mypage/BookmarkedTab"
import { CompletedTab } from "@/components/mypage/CompletedTab"
import { MyMeetingsTab } from "@/components/mypage/MyMeetingsTab"
import { ProfileCard } from "@/components/mypage/ProfileCard"
import { fetchMyProfile, type Profile } from "@/lib/api/mypage"
import { cn } from "@/lib/utils"

type TabKey = "recruiting" | "active" | "bookmarked" | "completed"

const tabs: { key: TabKey; label: string }[] = [
  { key: "recruiting", label: "모집중" },
  { key: "active", label: "활동중" },
  { key: "bookmarked", label: "찜한 모임" },
  { key: "completed", label: "완료된 모임" },
]

export default function MyPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>("recruiting")

  useEffect(() => {
    fetchMyProfile()
      .then(setProfile)
      .catch(() => setProfileError("프로필을 불러오지 못했습니다."))
  }, [])

  return (
    <section className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 px-6 py-10">
      <header>
        <p className="text-sm font-medium text-muted-foreground">My Page</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-normal">마이페이지</h1>
      </header>

      {profileError && (
        <p className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {profileError}
        </p>
      )}

      {profile && <ProfileCard profile={profile} onChange={setProfile} />}

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

      {activeTab === "recruiting" && <MyMeetingsTab status="recruiting" />}
      {activeTab === "active" && <MyMeetingsTab status="active" />}
      {activeTab === "bookmarked" && <BookmarkedTab />}
      {activeTab === "completed" && <CompletedTab />}
    </section>
  )
}
