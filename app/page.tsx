"use client"

import { Button } from "@/components/ui/button"
import InfoCard from "@/components/common/InfoCard"
import MeetingRecommendationCarousel from "@/components/common/MeetingRecommendationCarousel"
import { Badges } from "@/components/common/Badges"
import * as React from "react";

// 캘린더 관련
import { Calendars } from "@/components/common/Calendars"
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { MemberCountBar } from "@/components/common/MemberCountBar"
import { BookMarkBtn } from "@/components/common/BookMarkBtn"
import { VideoConference } from "@/components/dashboard/VideoConference"
import { UserAvatar } from "@/components/common/UserAvatar"
import { TimePicker } from "@/components/common/TimePicker"

export default function Page() {
  // 달력에서 선택한 날짜 상태
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined)
  return (
    <div className="flex min-h-svh justify-center p-6">
      <div className="flex w-full max-w-5xl flex-col items-center gap-6 text-sm leading-loose">
        <div className="flex flex-col items-center gap-4">
          <div className="text-center">
            <h1 className="font-medium">Project ready!</h1>
            <p>You may now add components and start building.</p>
            <p>We&apos;ve already added the button component for you.</p>
            <Button className="mt-2">Button</Button>
          </div>
          <div className="font-mono text-xs text-muted-foreground">
            (Press <kbd>d</kbd> to toggle dark mode)
          </div>

          <div className="flex flex-col items-center"> 테스트 용
            {/* 배지 - 오늘 마감 / 마감 / 디데이 / 모임장 배지 */}
            <div className="flex flex-col items-center gap-8">
              <div><Badges /></div>
              {/* 정원 인원 바 — 현재/전체 인원 */}
              <div className="w-64"><MemberCountBar current={4} max={6} /></div>
              {/* 선택한 날짜 값 표시 (읽기 전용) */}
              <input
                type="text"
                readOnly
                value={selectedDate ? format(selectedDate, "yyyy-MM-dd (EEE)", { locale: ko }) : ""}
                placeholder="날짜를 선택하세요"
                className="w-56 rounded-md border px-3 py-2 text-center text-sm"
              />
              <div><Calendars selected={selectedDate} onSelect={setSelectedDate} /></div>
              <TimePicker />
              <BookMarkBtn />
              <VideoConference />
              <UserAvatar />
              <InfoCard />
            </div>
          </div>
        </div>

        <MeetingRecommendationCarousel />
      </div>
    </div>
  )
}
