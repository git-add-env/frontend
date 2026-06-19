import { Skeleton } from "@/components/ui/skeleton"

// MeetingCard 레이아웃(썸네일 + 카테고리/제목/진행바)을 본뜬 로딩 스켈레톤.
export function MeetingCardSkeleton() {
  return (
    <div className="@container">
      <div className="flex flex-col gap-3 rounded-2xl border-2 border-border bg-card p-4 @md:flex-row @md:gap-4">
        <Skeleton className="h-32 w-full shrink-0 rounded-xl @md:h-28 @md:w-40" />
        <div className="flex min-w-0 flex-1 flex-col">
          <Skeleton className="h-5 w-16 rounded-sm" />
          <Skeleton className="mt-3 h-4 w-3/4" />
          <div className="mt-auto flex items-center gap-2 pt-3">
            <Skeleton className="size-3.5 rounded-full" />
            <Skeleton className="h-2 w-24 rounded-full" />
            <Skeleton className="h-3 w-10" />
          </div>
        </div>
      </div>
    </div>
  )
}

// 탭 그리드에 채울 스켈레톤 카드 묶음. grid className은 각 탭 레이아웃에 맞춰 주입한다.
export function MeetingCardSkeletonGrid({
  count = 4,
  className,
}: {
  count?: number
  className?: string
}) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <MeetingCardSkeleton key={i} />
      ))}
    </div>
  )
}
