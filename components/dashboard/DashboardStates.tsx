import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

// 대시보드 탭 공통 로딩 스켈레톤(리스트 행 n개). "불러오는 중..." 평문 대체.
// 기본은 role="status" + sr-only로 보조기기에 로딩을 알린다.
// decorative: 다른 status 영역(예: DashboardContentSkeleton) 안에 중첩될 때 이중 안내 방지용.
export function ListSkeleton({
  rows = 3,
  className,
  decorative = false,
}: {
  rows?: number
  className?: string
  decorative?: boolean
}) {
  return (
    <div
      className={cn("flex flex-col gap-2", className)}
      {...(decorative ? { "aria-hidden": true } : { role: "status" })}
    >
      {!decorative && <span className="sr-only">불러오는 중</span>}
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-16 w-full rounded-lg" />
      ))}
    </div>
  )
}

// 대시보드 컨텐츠 영역 전체 스켈레톤(제목 + 회의 배너 + 탭 + 리스트).
// 사이드바 로딩과 동시에 띄워, 스켈레톤이 좌→우로 두 번 뜨는 어색함을 없앤다.
export function DashboardContentSkeleton() {
  return (
    // role="status" + sr-only로 로딩을 알린다. 내부 스켈레톤은 빈 박스라 읽히지 않고,
    // 중첩 ListSkeleton은 decorative로 이중 안내를 막는다.
    <div role="status" className="flex flex-col gap-4">
      <span className="sr-only">불러오는 중</span>
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-20 w-full rounded-2xl" />
      <div className="flex gap-2 border-b border-border pb-2">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-6 w-16" />
        ))}
      </div>
      <ListSkeleton rows={3} decorative />
    </div>
  )
}

// 대시보드 탭 공통 빈 상태(점선 박스로 톤 통일).
export function EmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
      {message}
    </p>
  )
}
