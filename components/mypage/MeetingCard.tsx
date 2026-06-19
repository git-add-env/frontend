"use client"

import { useState } from "react"

import {
  CheckCircle2,
  Clock,
  Crown,
  FolderGit2,
  MoreHorizontal,
  Trophy,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react"

import { CategoryBadge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Progress } from "@/components/ui/progress"
import { CATEGORY_LABEL } from "@/constants/category"
import type { Meeting } from "@/lib/api/mypage"
import { formatDeadline } from "@/lib/date"
import { cn } from "@/lib/utils"

type MeetingCardProps = {
  meeting: Meeting
  // ⋯ 드롭다운 안에 들어갈 액션들(삭제/종료/참여취소 등). 없으면 ⋯ 버튼 자체를 숨긴다.
  menu?: React.ReactNode
  // 우상단(헤더) 액션 슬롯(예: 찜 버튼).
  headerAction?: React.ReactNode
  // 우하단 액션 슬롯(예: "내 모임" 버튼).
  action?: React.ReactNode
  onClick?: () => void
}

// 카테고리별 썸네일 그라데이션 + 아이콘 (thumbnailUrl 없을 때의 플레이스홀더).
const CATEGORY_THUMB: Record<string, { gradient: string; Icon: LucideIcon }> = {
  PROJECT: { gradient: "from-indigo-500 to-violet-500", Icon: FolderGit2 },
  HACKATHON: { gradient: "from-orange-500 to-pink-500", Icon: Zap },
  CONTEST: { gradient: "from-teal-400 to-sky-500", Icon: Trophy },
}

function Thumbnail({ meeting }: { meeting: Meeting }) {
  const { gradient, Icon } = CATEGORY_THUMB[meeting.category] ?? {
    gradient: "from-slate-400 to-slate-500",
    Icon: FolderGit2,
  }
  return (
    <div className="relative h-32 w-full shrink-0 @md:h-auto @md:w-40 @md:self-stretch">
      {meeting.thumbnailUrl ? (
        // 임의 S3 URL이라 next/image 도메인 설정을 피하려고 raw img 사용
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={meeting.thumbnailUrl}
          alt=""
          className="h-full w-full rounded-xl object-cover"
        />
      ) : (
        <div
          className={cn(
            "flex h-full w-full items-center justify-center rounded-xl bg-gradient-to-br text-white",
            gradient,
          )}
        >
          <Icon className="size-9" />
        </div>
      )}
      {/* 모임장 표시: 썸네일 좌상단 아이콘 (모임장 배지 대체) */}
      {meeting.isLeader && (
        <span
          className="absolute left-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-amber-400 text-white shadow-sm"
          aria-label="모임장"
        >
          <Crown className="size-3.5" />
        </span>
      )}
    </div>
  )
}

export function MeetingCard({ meeting, menu, headerAction, action, onClick }: MeetingCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { currentCount, totalCount } = meeting.recruitSummary
  const pct = totalCount > 0 ? Math.min(100, Math.round((currentCount / totalCount) * 100)) : 0

  return (
    // @container 래퍼: 카드가 뷰포트가 아니라 '자기 칸(grid cell) 너비'에 맞춰 레이아웃을 바꾼다.
    <div className="@container" onClick={onClick}>
      {/* @container 칸 기준으로 좁으면 세로, 넓으면 가로 */}
      <div
        className={cn(
          // 칸이 좁으면(@md 미만) 썸네일을 위로 쌓고(flex-col), 넓으면 가로 배치(@md:flex-row).
          "flex flex-col gap-3 rounded-2xl border-2 border-border bg-card p-4 @md:flex-row @md:gap-4",
          // hover는 배경색 대신 살짝 떠오르는 그림자로 — 내부 버튼 hover와 색이 겹치지 않게.
          onClick && "cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
        )}
      >
        <Thumbnail meeting={meeting} />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-3.5">
          <CategoryBadge category={CATEGORY_LABEL[meeting.category] ?? meeting.category} />
          {/* 마감 카운트다운은 모집중일 때만 의미 있음 (활동중/완료는 이미 모집 종료) */}
          {meeting.status === "RECRUITING" &&
            (() => {
              const remaining = formatDeadline(meeting.deadline)
              return (
                <span
                  className={cn(
                    "flex items-center gap-1 text-sm",
                    // 오늘 마감(시간 단위 임박)이면 빨간색 강조, D-N 카운트다운은 기존 muted 색 유지
                    meeting.isDeadlineToday
                      ? "font-semibold text-destructive"
                      : "font-medium text-muted-foreground",
                  )}
                >
                  <Clock className="size-3.5" aria-hidden="true" />
                  {/* formatDeadline은 마감 경과 시 "마감"을 반환 → "마감 마감" 중복 방지 */}
                  {remaining === "마감" ? "마감" : `마감 ${remaining}`}
                </span>
              )
            })()}
          {meeting.status === "COMPLETED" && (
            <span className="ml-auto mr-1 flex items-center gap-1 text-sm font-medium text-emerald-500">
              <CheckCircle2 className="size-3.5" aria-hidden="true" />
              완료
            </span>
          )}

          {headerAction && (
            <div className="ml-auto shrink-0" onClick={(e) => e.stopPropagation()}>
              {headerAction}
            </div>
          )}

          {menu && (
            <Popover open={menuOpen} onOpenChange={setMenuOpen}>
              <PopoverTrigger
                onClick={(e) => e.stopPropagation()}
                aria-label="더보기"
                className="ml-auto shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <MoreHorizontal className="size-4" />
              </PopoverTrigger>
              <PopoverContent
                align="end"
                onClick={(e) => {
                  e.stopPropagation()
                  setMenuOpen(false)
                }}
                className="flex min-w-32 flex-col p-1"
              >
                {menu}
              </PopoverContent>
            </Popover>
          )}
        </div>

        {/* min-h-10: 제목 2줄 높이를 항상 확보 → 1줄/2줄에 따라 카드 높이가 들쑥거리지 않게.
            pr-8: 우상단 버튼(⋯/찜) 쪽으로 제목이 번지지 않게 오른쪽 여백 확보. */}
        <h3 className="mt-3 line-clamp-2 min-h-10 pl-2 pr-8 text-sm font-semibold">{meeting.title}</h3>

        {/* min-h-11: 하단에 액션 버튼(h-8)이 없는 탭(찜·완료)도 같은 높이를 확보 → 탭 간 카드 높이 통일 */}
        <div className="mt-auto flex min-h-11 items-center gap-2 pt-3">
          <Users className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <Progress value={pct} className="w-24 shrink-0" />
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {currentCount}/{totalCount}명
          </span>
          {action && (
            <div className="ml-auto shrink-0" onClick={(e) => e.stopPropagation()}>
              {action}
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  )
}
