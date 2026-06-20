"use client"

import { useState } from "react"
import Link from "next/link"

import {
  CheckCircle2,
  Crown,
  FolderGit2,
  MoreHorizontal,
  Trophy,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react"

import { MeetingDeadlineBadge } from "@/components/common/MeetingDeadlineBadge"
import { CategoryBadge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Progress } from "@/components/ui/progress"
import { CATEGORY_LABEL } from "@/constants/category"
import type { Meeting } from "@/lib/api/mypage"
import { cn } from "@/lib/utils"

type MeetingCardProps = {
  meeting: Meeting
  // ⋯ 드롭다운 안에 들어갈 액션들(삭제/종료/참여취소 등). 없으면 ⋯ 버튼 자체를 숨긴다.
  menu?: React.ReactNode
  // 우상단(헤더) 액션 슬롯(예: 찜 버튼).
  headerAction?: React.ReactNode
  // 우하단 액션 슬롯(예: "내 모임" 버튼).
  action?: React.ReactNode
  // 카드 클릭 시 이동할 상세 경로. 제목에 stretched link를 깔아 카드 전체를 키보드 접근 가능한 링크로 만든다.
  href?: string
  // 켜면 모집중 외(활동중)에도 마감일을 표시한다(완료는 ✓완료 우선). 찜 탭처럼 상태 무관하게 마감일을 보여줄 때.
  showDeadline?: boolean
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
    <div className="relative w-32 shrink-0 self-stretch sm:h-32 sm:w-full sm:self-auto md:h-auto md:w-32 md:self-stretch">
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

export function MeetingCard({
  meeting,
  menu,
  headerAction,
  action,
  href,
  showDeadline,
}: MeetingCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { currentCount, totalCount } = meeting.recruitSummary
  const pct = totalCount > 0 ? Math.min(100, Math.round((currentCount / totalCount) * 100)) : 0

  return (
    // @container 래퍼: 카드 내부 레이아웃 기준 컨텍스트(필요 시 컨테이너 쿼리용).
    <div className="@container">
      {/* 배치 전환: 모바일(가로) → sm 좁은 2열(세로, 이미지 위) → md+ 넓은 2열·3열(가로, 이미지 왼쪽) */}
      <div
        className={cn(
          // relative: 제목 stretched link(after:inset-0)가 카드 전체를 덮는 기준점.
          "relative flex flex-row gap-4 rounded-2xl border-2 border-border bg-card p-4 sm:flex-col sm:gap-3 md:flex-row md:gap-4",
          // hover는 떠오르는 그림자. 링은 '제목 링크(a)가 키보드 포커스'일 때만 — 내부 버튼(⋯/찜) 클릭엔 안 뜨게.
          href &&
          "cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring",
        )}
      >
        <Thumbnail meeting={meeting} />

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex min-w-0 items-center gap-2">
            <CategoryBadge category={CATEGORY_LABEL[meeting.category] ?? meeting.category} />
            {/* 마감 카운트다운: 기본은 모집중일 때만. showDeadline(찜 탭)이면 완료 외(활동중 포함)에도 표시. */}
            {(meeting.status === "RECRUITING" ||
              (showDeadline && meeting.status !== "COMPLETED")) ? (
              <MeetingDeadlineBadge
                deadline={meeting.deadline}
                isDeadlineToday={meeting.isDeadlineToday}
              />
            ) : null}
            {meeting.status === "COMPLETED" && (
              <span className="ml-auto mr-1 flex items-center gap-1 text-sm font-medium text-emerald-500">
                <CheckCircle2 className="size-3.5" aria-hidden="true" />
                완료
              </span>
            )}

            {headerAction && (
              // relative z-10: stretched link 오버레이 위에 떠서 버튼이 그대로 클릭되게.
              <div className="relative z-10 ml-auto shrink-0">{headerAction}</div>
            )}

            {menu && (
              <Popover open={menuOpen} onOpenChange={setMenuOpen}>
                <PopoverTrigger
                  onClick={(e) => e.stopPropagation()}
                  aria-label="더보기"
                  className="relative z-10 ml-auto shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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
          <h3 className="mt-3 line-clamp-2 min-h-10 pl-2 pr-8 text-sm font-semibold">
            {href ? (
              // stretched link: 제목이 링크의 접근성 이름이 되고, after:inset-0가 카드 전체를 덮어
              // 어디를 눌러도 상세로 이동. 진짜 <a>라 Tab 포커스·Enter·새 탭 열기 모두 지원.
              <Link href={href} className="outline-none after:absolute after:inset-0">
                {meeting.title}
              </Link>
            ) : (
              meeting.title
            )}
          </h3>

          {/* min-h-11: 하단에 액션 버튼(h-8)이 없는 탭(찜·완료)도 같은 높이를 확보 → 탭 간 카드 높이 통일
              min-w-0: 좁은 칸에서 자식이 칼럼 밖으로 넘치지 않게(overflow 방지) */}
          <div className="mt-auto flex min-h-11 min-w-0 items-center gap-2 pt-3">
            <Users className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
            {/* flex-1 + min-w-0: 칸이 좁으면 진행률 바가 먼저 줄어든다(고정폭 w-24가 명수/버튼을 카드 밖으로 밀던 원인 제거) */}
            <Progress value={pct} className="min-w-0 flex-1" />
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
              {currentCount}/{totalCount}명
            </span>
            {action && <div className="relative z-10 shrink-0">{action}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}
