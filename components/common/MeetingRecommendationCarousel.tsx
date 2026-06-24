"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { ChevronLeft, ChevronRight } from "lucide-react"

import MeetingCard, {
  mapMeetingSummaryToCardMeeting,
} from "@/components/common/MeetingCard"
import { Button } from "@/components/ui/button"
import { queryKeys } from "@/hooks/api/query-keys"
import { fetchMeetings } from "@/lib/api/meetings"
import { cn } from "@/lib/utils"

// 인기순(sort=popular)으로 정렬된 실제 모임을 API에서 받아 추천으로 보여준다.
const RECOMMEND_FETCH_SIZE = 12
const RECOMMEND_DISPLAY_COUNT = 8

type MeetingRecommendationCarouselProps = {
  className?: string
  // 현재 보고 있는 모임은 추천에서 제외한다.
  currentMeetingId?: number
}

export function MeetingRecommendationCarousel({
  className,
  currentMeetingId,
}: MeetingRecommendationCarouselProps) {
  const listRef = React.useRef<HTMLDivElement>(null)

  const { data } = useQuery({
    queryKey: [...queryKeys.meetings.list, "recommend", "popular"],
    queryFn: () => fetchMeetings({ sort: "popular", size: RECOMMEND_FETCH_SIZE }),
  })

  const meetings = (data?.meetings ?? [])
    .filter((meeting) => meeting.meetingId !== currentMeetingId)
    .slice(0, RECOMMEND_DISPLAY_COUNT)

  const scrollByCard = (direction: "prev" | "next") => {
    const list = listRef.current

    if (!list) {
      return
    }

    const firstCard = list.querySelector<HTMLElement>("[data-meeting-card]")
    const cardWidth = firstCard?.offsetWidth ?? 280

    list.scrollBy({
      left: direction === "next" ? cardWidth + 16 : -(cardWidth + 16),
      behavior: "smooth",
    })
  }

  // 추천할 모임이 없으면(로딩 전/결과 없음) 섹션 자체를 노출하지 않는다.
  if (meetings.length === 0) {
    return null
  }

  return (
    <section className={cn("w-full space-y-4", className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">
            개발자 모임 추천
          </p>
          <h2 className="text-xl font-semibold tracking-normal">
            이런 모임은 어때요?
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="이전 모임 보기"
            onClick={() => scrollByCard("prev")}
          >
            <ChevronLeft />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="다음 모임 보기"
            onClick={() => scrollByCard("next")}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>

      <div
        ref={listRef}
        className="flex snap-x gap-4 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {meetings.map((meeting) => (
          <div
            key={meeting.meetingId}
            data-meeting-card
            className="w-[260px] shrink-0 snap-start md:w-[280px]"
          >
            {/* 모임찾기 목록과 동일한 카드. 추천에선 북마크 버튼은 숨긴다. */}
            <MeetingCard
              meeting={mapMeetingSummaryToCardMeeting(meeting)}
              showBookmark={false}
            />
          </div>
        ))}
      </div>
    </section>
  )
}
