"use client"

import Image from "next/image"
import Link from "next/link"
import { Users } from "lucide-react"

import { PositionJobCountBadges } from "@/components/common/Badges"
import { BookMarkBtn } from "@/components/common/BookMarkBtn"
import { MemberCountBar } from "@/components/common/MemberCountBar"
import {
  CategoryBadge,
  TechStackBadges,
  TodayDeadlineBadge,
} from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

export type Meeting = {
  id: string
  title: string
  date: string
  deadline: string
  status: "개설확정" | "모집중" | "마감"
  category: string
  memberCount: number
  maxMembers: number
  techStacks?: string[]
  jobs?: { job: string; current: number; max: number }[]
  imageUrl: string
  isBookmarked?: boolean
  isClosingToday?: boolean
}

type MeetingCardProps = {
  meeting: Meeting
  onBookmarkToggle?: (meetingId: string, bookmarked: boolean) => void
}

type MeetingCardImageProps = {
  imageUrl: string
  title: string
  isBookmarked?: boolean
  isClosingToday?: boolean
  onBookmarkToggle?: (bookmarked: boolean) => void
  showBookmark?: boolean
  className?: string
  sizes?: string
}

export function MeetingCardImage({
  imageUrl,
  title,
  isBookmarked,
  isClosingToday,
  onBookmarkToggle,
  showBookmark = true,
  className,
  sizes = "(min-width: 1280px) 384px, (min-width: 768px) 50vw, 100vw",
}: MeetingCardImageProps) {
  return (
    <div className={className}>
      <Image
        src={imageUrl}
        alt={title}
        fill
        unoptimized
        sizes={sizes}
        className="object-cover"
      />
      {isClosingToday ? (
        <TodayDeadlineBadge className="absolute bottom-4 left-4" />
      ) : null}
      {showBookmark ? (
        <BookMarkBtn
          bookmarked={isBookmarked}
          onToggle={onBookmarkToggle}
          className="absolute right-4 top-4 size-9 bg-white/80 p-2 shadow-sm backdrop-blur-md hover:bg-white"
        />
      ) : null}
    </div>
  )
}

export default function MeetingCard({ meeting, onBookmarkToggle }: MeetingCardProps) {
  function handleBookmarkToggle(bookmarked: boolean) {
    onBookmarkToggle?.(meeting.id, bookmarked)
  }

  return (
    <Card className="min-h-[472px] gap-0 overflow-hidden rounded-xl border border-[#c3c6d7] bg-white py-0 shadow-none transition hover:-translate-y-0.5 hover:shadow-md">
      <MeetingCardImage
        imageUrl={meeting.imageUrl}
        title={meeting.title}
        isBookmarked={meeting.isBookmarked}
        isClosingToday={meeting.isClosingToday}
        onBookmarkToggle={handleBookmarkToggle}
        className="relative h-48 w-full overflow-hidden bg-[#e6e8ea]"
      />

      <CardContent className="flex flex-1 flex-col gap-4 p-6">
        <div className="flex flex-col gap-1">
          <CategoryBadge
            category={meeting.category}
            className="h-5 px-2.5 text-xs font-medium"
          />
          <Link href={`/meetings/${meeting.id}`} className="block">
            <h3 className="line-clamp-2 min-h-7 pt-1 text-xl font-medium leading-7 text-[#191c1e] transition hover:text-blue-500">
              {meeting.title}
            </h3>
          </Link>
          {meeting.techStacks?.length ? (
            <TechStackBadges
              techStacks={meeting.techStacks}
              className="pt-1"
            />
          ) : null}
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 text-sm font-medium text-[#191c1e]">
              <Users className="size-3.5 text-[#434655]" aria-hidden="true" />
              <span>모집 현황</span>
            </div>
            <MemberCountBar
              current={meeting.memberCount}
              max={meeting.maxMembers}
              showUnit={false}
              className="w-28 gap-2"
              trackClassName="h-1.5"
              valueClassName="min-w-7 text-right font-bold"
            />
          </div>

          {meeting.jobs?.length ? (
            <PositionJobCountBadges
              jobs={meeting.jobs}
              className="flex flex-wrap gap-1.5"
              badgeClassName="h-7 rounded-lg px-2.5 text-xs font-medium"
            />
          ) : null}
        </div>

        <p className="mt-auto text-xs font-medium text-[#434655]">
          마감일: {meeting.deadline}
        </p>
      </CardContent>
    </Card>
  )
}
