"use client"

import * as React from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { CalendarDays, ChevronLeft, ChevronRight, UsersRound } from "lucide-react"

import { MeetingCardImage } from "@/components/common/MeetingCard"
import { Button } from "@/components/ui/button"
import { CATEGORY_LABEL } from "@/constants/category"
import { queryKeys } from "@/hooks/api/query-keys"
import { fetchMeetings } from "@/lib/api/meetings"
import { cn } from "@/lib/utils"

// 인기순(sort=popular)으로 정렬된 실제 모임을 API에서 받아 추천으로 보여준다.
const RECOMMEND_FETCH_SIZE = 12
const RECOMMEND_DISPLAY_COUNT = 8

function formatDeadline(deadline: string) {
  const date = new Date(deadline)
  if (Number.isNaN(date.getTime())) {
    return deadline
  }
  return `${date.getMonth() + 1}월 ${date.getDate()}일 마감`
}

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
          <article
            key={meeting.meetingId}
            data-meeting-card
            className="w-[260px] shrink-0 snap-start md:w-[280px]"
          >
            <Link
              href={`/meetings/${meeting.meetingId}`}
              className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <MeetingCardImage
                imageUrl={meeting.thumbnailUrl}
                category={meeting.category}
                title={meeting.title}
                showBookmark={false}
                className="relative aspect-[4/3] w-full overflow-hidden bg-[#e6e8ea]"
                sizes="(min-width: 768px) 280px, 260px"
              />
              <div className="flex min-h-44 flex-1 flex-col justify-between p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                      {CATEGORY_LABEL[meeting.category] ?? meeting.category}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <UsersRound className="size-3.5" />
                      {meeting.recruitSummary.currentCount}명
                    </span>
                  </div>
                  <h3 className="line-clamp-2 text-base font-semibold leading-snug">
                    {meeting.title}
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="size-4" />
                  <span>{formatDeadline(meeting.deadline)}</span>
                </div>
              </div>
            </Link>
          </article>
        ))}
      </div>
    </section>
  )
}
