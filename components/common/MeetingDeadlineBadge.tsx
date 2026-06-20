"use client"

import { Clock } from "lucide-react"

import { formatDeadline } from "@/lib/date"
import { cn } from "@/lib/utils"

type MeetingDeadlineBadgeProps = {
  deadline: string
  isDeadlineToday?: boolean
  className?: string
}

export function MeetingDeadlineBadge({
  deadline,
  isDeadlineToday,
  className,
}: MeetingDeadlineBadgeProps) {
  const remaining = formatDeadline(deadline)
  const isToday = isDeadlineToday || remaining === "오늘 마감"

  return (
    <span
      className={cn(
        "flex shrink-0 items-center gap-1 text-sm",
        isToday
          ? "font-semibold text-destructive"
          : "font-medium text-muted-foreground",
        className,
      )}
    >
      <Clock className="size-3.5" aria-hidden="true" />
      {remaining}
    </span>
  )
}
