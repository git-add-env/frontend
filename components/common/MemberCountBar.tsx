import { cn } from "@/lib/utils"

// 정원 대비 현재 인원을 막대(progress bar) + "현재/전체명" 텍스트로 표시
export function MemberCountBar({
    current,
    max,
    className,
}: {
    current: number
    max: number
    className?: string
}) {
    // 0~1 비율 (max 0 방어, 1 초과 방어)
    const ratio = max > 0 ? Math.min(current / max, 1) : 0
    const percent = Math.round(ratio * 100)
    const isFull = current >= max

    return (
        <div className={cn("flex items-center gap-2", className)}>
            {/* 트랙(회색) + 채워지는 막대 */}
            <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                    className={cn(
                        "h-full rounded-full transition-all",
                        isFull ? "bg-foreground" : "bg-primary"
                    )}
                    style={{ width: `${percent}%` }}
                />
            </div>
            {/* 현재/전체 인원 */}
            <span className="shrink-0 text-xs font-medium text-muted-foreground tabular-nums">
                {current}/{max}명
            </span>
        </div>
    )
}
