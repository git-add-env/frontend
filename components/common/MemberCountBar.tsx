import { cn } from "@/lib/utils"

// 정원 대비 현재 인원을 막대(progress bar) + "현재/전체명" 텍스트로 표시
export function MemberCountBar({
  current,
  max,
  className,
  trackClassName,
  indicatorClassName,
  valueClassName,
  showUnit = true,
}: {
  current: number
  max: number
  className?: string
  trackClassName?: string
  indicatorClassName?: string
  valueClassName?: string
  showUnit?: boolean
}) {
  const ratio = max > 0 ? Math.min(current / max, 1) : 0
  const percent = Math.round(ratio * 100)
  const isFull = current >= max

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "relative h-2 flex-1 overflow-hidden rounded-full bg-muted",
          trackClassName,
        )}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all",
            isFull ? "bg-foreground" : "bg-primary",
            indicatorClassName,
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span
        className={cn(
          "shrink-0 text-xs font-medium text-muted-foreground tabular-nums",
          valueClassName,
        )}
      >
        {current}/{max}
        {showUnit ? "명" : null}
      </span>
    </div>
  )
}
