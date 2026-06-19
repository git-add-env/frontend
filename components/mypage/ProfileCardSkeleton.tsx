import { Skeleton } from "@/components/ui/skeleton"

// ProfileCard 보기 배너(아바타 + 이름/직군/소개/이메일/스택 + 수정 버튼) 모양의 로딩 스켈레톤.
export function ProfileCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card px-6 py-5">
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-7">
        <Skeleton className="size-28 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-3">
          <Skeleton className="h-6 w-44" />
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-4 w-36" />
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>
        <Skeleton className="h-9 w-full shrink-0 rounded-md sm:w-28 sm:self-start" />
      </div>
    </div>
  )
}
