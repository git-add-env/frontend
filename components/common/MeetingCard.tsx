"use client"

import Image from "next/image"
import Link from "next/link"
import { Users } from "lucide-react"

import { PositionJobCountBadges } from "@/components/common/Badges"
import { BookMarkBtn } from "@/components/common/BookMarkBtn"
import { CategoryThumbnailPlaceholder } from "@/components/common/CategoryThumbnailPlaceholder"
import { MeetingDeadlineBadge } from "@/components/common/MeetingDeadlineBadge"
import { MemberCountBar } from "@/components/common/MemberCountBar"
import {
  CategoryBadge,
  TechStackBadges,
} from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

export type Meeting = {
  id: string
  title: string
  date: string
  deadline: string
  deadlineDate?: string
  status: "개설확정" | "모집중" | "마감"
  category: string
  memberCount: number
  maxMembers: number
  techStacks?: string[]
  jobs?: { job: string; current: number; max: number }[]
  imageCategory?: string
  imageUrl?: string | null
  isBookmarked?: boolean
  isClosingToday?: boolean
}

type MeetingCardProps = {
  meeting: Meeting
  disableLink?: boolean
  onBookmarkToggle?: (meetingId: string, bookmarked: boolean) => void
  bookmarkDisabled?: boolean
  showEmptyPreviewHints?: boolean
  showBookmark?: boolean
}

type MeetingCardImageProps = {
  category?: string
  imageUrl?: string | null
  title: string
  deadline?: string
  isBookmarked?: boolean
  isClosingToday?: boolean
  onBookmarkToggle?: (bookmarked: boolean) => void
  showBookmark?: boolean
  bookmarkDisabled?: boolean
  className?: string
  sizes?: string
}

export function MeetingCardImage({
  imageUrl,
  category,
  title,
  deadline,
  isBookmarked,
  isClosingToday,
  onBookmarkToggle,
  showBookmark = true,
  bookmarkDisabled = false,
  className,
  sizes = "(min-width: 1280px) 384px, (min-width: 768px) 50vw, 100vw",
}: MeetingCardImageProps) {
  return (
    <div className={className}>
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={title}
          fill
          unoptimized
          sizes={sizes}
          className="object-cover"
        />
      ) : (
        <CategoryThumbnailPlaceholder category={category ?? ""} className="size-full" />
      )}
      {isClosingToday && deadline ? (
        <MeetingDeadlineBadge
          deadline={deadline}
          isDeadlineToday
          className="absolute left-4 top-4 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-bold [&>svg]:size-3"
        />
      ) : null}
      {showBookmark ? (
        <BookMarkBtn
          bookmarked={isBookmarked}
          onToggle={onBookmarkToggle}
          disabled={bookmarkDisabled}
          className="absolute right-4 top-4 z-20 size-9 bg-white/80 p-2 shadow-sm backdrop-blur-md hover:bg-white"
        />
      ) : null}
    </div>
  )
}

export default function MeetingCard({
  meeting,
  disableLink = false,
  onBookmarkToggle,
  bookmarkDisabled = false,
  showEmptyPreviewHints = false,
  showBookmark = true,
}: MeetingCardProps) {
  function handleBookmarkToggle(bookmarked: boolean) {
    onBookmarkToggle?.(meeting.id, bookmarked)
  }

  return (
    <Card className="group relative h-full gap-0 overflow-hidden rounded-lg border-0 bg-white py-0 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      {!disableLink ? (
        <Link
          href={`/meetings/${meeting.id}`}
          aria-label={`${meeting.title} 상세보기`}
          className="absolute inset-0 z-10 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1abcfe] focus-visible:ring-offset-2"
        >
          <span className="sr-only">{meeting.title} 상세보기</span>
        </Link>
      ) : null}

      <MeetingCardImage
        category={meeting.imageCategory ?? meeting.category}
        imageUrl={meeting.imageUrl}
        title={meeting.title}
        deadline={meeting.deadlineDate ?? meeting.deadline}
        isBookmarked={meeting.isBookmarked}
        isClosingToday={meeting.isClosingToday}
        onBookmarkToggle={handleBookmarkToggle}
        bookmarkDisabled={bookmarkDisabled}
        showBookmark={showBookmark}
        className="relative aspect-[4/3] w-full overflow-hidden bg-[#e6e8ea]"
        sizes="(min-width: 1280px) 280px, (min-width: 768px) 50vw, 100vw"
      />

      <CardContent className="flex h-[276px] flex-1 flex-col gap-3 p-4">
        <div className="flex min-h-0 flex-col gap-1.5">
          <CategoryBadge
            category={meeting.category}
            className="h-5 px-2.5 text-xs font-medium"
          />
          <h3 className="line-clamp-2 min-h-7 pt-1 text-base font-semibold leading-snug text-[#191c1e] transition group-hover:text-blue-500">
            {meeting.title}
          </h3>

          {meeting.techStacks?.length ? (
            <TechStackBadges
              techStacks={meeting.techStacks}
              className="mt-1 max-h-11 min-h-11 overflow-hidden gap-1 [&_[data-slot=badge]]:h-5 [&_[data-slot=badge]]:px-1.5 [&_[data-slot=badge]]:text-[10px]"
            />
          ) : showEmptyPreviewHints ? (
            <p className="mt-1 min-h-11 text-xs leading-5 text-[#737686]">
              기술스택이 여기에 표시됩니다.
            </p>
          ) : null}

          {meeting.jobs?.length ? (
            <PositionJobCountBadges
              jobs={meeting.jobs}
              className="mt-2 flex max-h-[52px] min-h-[52px] flex-wrap gap-1 overflow-hidden"
              badgeClassName="h-6 px-2 text-[11px] font-medium [&>svg]:hidden [&_.meeting-job-count]:hidden"
            />
          ) : showEmptyPreviewHints ? (
            <p className="mt-2 min-h-[52px] text-xs leading-5 text-[#737686]">
              포지션이 여기에 표시됩니다.
            </p>
          ) : null}
        </div>

        <div className="-mx-4 mt-auto border-t border-[#e6e8ea]" />

        <div className="flex items-center justify-between gap-3 text-[11px] font-medium text-[#434655]">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex shrink-0 items-center gap-1">
              <Users className="size-3 text-[#434655]" aria-hidden="true" />
              모집 현황
            </span>
            <MemberCountBar
              current={meeting.memberCount}
              max={meeting.maxMembers}
              showUnit={false}
              className="w-24 gap-1"
              trackClassName="h-1"
              valueClassName="min-w-6 text-right text-[11px] font-bold text-[#434655]"
            />
          </div>

          <p className="shrink-0">마감일: {meeting.deadline}</p>
        </div>
      </CardContent>
    </Card>
  )
}
