"use client"

import * as React from "react"
import Image from "next/image"
import { CalendarDays, ChevronLeft, ChevronRight, UsersRound } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const meetings = [
  {
    title: "AI 서비스 48시간 해커톤",
    deadline: "6월 3일 마감",
    category: "해커톤",
    memberCount: 36,
    imageUrl:
      "https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?auto=format&fit=crop&w=640&q=80",
  },
  {
    title: "공공데이터 활용 공모전 팀빌딩",
    deadline: "6월 5일 마감",
    category: "공모전",
    memberCount: 18,
    imageUrl:
      "https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=640&q=80",
  },
  {
    title: "사이드 프로젝트 MVP 스프린트",
    deadline: "6월 7일 마감",
    category: "프로젝트",
    memberCount: 12,
    imageUrl:
      "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=640&q=80",
  },
  {
    title: "프론트엔드 포트폴리오 스터디",
    deadline: "6월 9일 마감",
    category: "스터디",
    memberCount: 9,
    imageUrl:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=640&q=80",
  },
  {
    title: "오픈소스 첫 기여 모임",
    deadline: "6월 11일 마감",
    category: "오픈소스",
    memberCount: 15,
    imageUrl:
      "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=640&q=80",
  },
  {
    title: "스타트업 랜딩페이지 빌드업",
    deadline: "6월 13일 마감",
    category: "프로젝트",
    memberCount: 8,
    imageUrl:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=640&q=80",
  },
  {
    title: "백엔드 API 설계 챌린지",
    deadline: "6월 15일 마감",
    category: "챌린지",
    memberCount: 11,
    imageUrl:
      "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=640&q=80",
  },
  {
    title: "디자이너와 개발자 협업 실험실",
    deadline: "6월 17일 마감",
    category: "협업",
    memberCount: 14,
    imageUrl:
      "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=640&q=80",
  },
  {
    title: "취준생 기술면접 모의 세션",
    deadline: "6월 19일 마감",
    category: "커리어",
    memberCount: 10,
    imageUrl:
      "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=640&q=80",
  },
  {
    title: "주말 앱 출시 프로젝트",
    deadline: "6월 21일 마감",
    category: "런칭",
    memberCount: 16,
    imageUrl:
      "https://images.unsplash.com/photo-1556155092-490a1ba16284?auto=format&fit=crop&w=640&q=80",
  },
]

export default function MeetingRecommendationCarousel({
  className,
}: {
  className?: string
}) {
  const listRef = React.useRef<HTMLDivElement>(null)

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
            key={meeting.title}
            data-meeting-card
            className="flex w-[260px] shrink-0 snap-start flex-col overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm md:w-[280px]"
          >
            <div className="relative aspect-[4/3] w-full">
              <Image
                src={meeting.imageUrl}
                alt=""
                fill
                sizes="(min-width: 768px) 280px, 260px"
                className="object-cover"
              />
            </div>
            <div className="flex min-h-44 flex-1 flex-col justify-between p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
                    {meeting.category}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <UsersRound className="size-3.5" />
                    {meeting.memberCount}명
                  </span>
                </div>
                <h3 className="line-clamp-2 text-base font-semibold leading-snug">
                  {meeting.title}
                </h3>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarDays className="size-4" />
                <span>{meeting.deadline}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
