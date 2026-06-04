import {
  Badge,
  CategoryBadge,
  HostBadge,
  MemberCountBadge,
  TodayDeadlineBadge,
} from "@/components/ui/badge"
import { CATEGORY_LABEL } from "@/constants/category"
import { STATUS_BADGE_VARIANT, STATUS_LABEL } from "@/constants/status"
import type { Meeting } from "@/lib/api/mypage"
import { formatDeadline } from "@/lib/date"
import { cn } from "@/lib/utils"

type MeetingCardProps = {
  meeting: Meeting
  footer?: React.ReactNode
  onClick?: () => void
}

export function MeetingCard({ meeting, footer, onClick }: MeetingCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-5",
        onClick && "cursor-pointer transition-colors hover:bg-accent/40",
      )}
      onClick={onClick}
    >
      <div className="mb-2 flex items-center gap-2">
        <CategoryBadge category={CATEGORY_LABEL[meeting.category] ?? meeting.category} />
        {/* TODO: 백엔드 isLeader 추가 시 meeting.isLeader && 로 교체 (현재 목록 응답에 없어 항상 표시) */}
        <HostBadge />
        <Badge variant={STATUS_BADGE_VARIANT[meeting.status] ?? "muted"} className="ml-auto">
          {STATUS_LABEL[meeting.status] ?? meeting.status}
        </Badge>
      </div>
      <h3 className="text-sm font-semibold">{meeting.title}</h3>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <MemberCountBadge
          current={meeting.recruitSummary.currentCount}
          max={meeting.recruitSummary.totalCount}
        />
        {/* 마감 카운트다운은 모집중일 때만 의미 있음 (활동중/완료는 이미 모집 종료) */}
        {meeting.status === "RECRUITING" &&
          (meeting.isDeadlineToday ? (
            <TodayDeadlineBadge />
          ) : (
            <Badge variant="dday">{formatDeadline(meeting.deadline)}</Badge>
          ))}
      </div>
      {footer}
    </div>
  )
}
