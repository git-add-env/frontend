import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

// 모임 화면(찾기·상세·생성/수정) 로딩 스켈레톤 모음.
// 각 실제 레이아웃(컨테이너 grid/컬럼/카드)을 본떠 로딩 중 레이아웃이 튀지 않게 한다.

// ── 모임 찾기 ─────────────────────────────────────────────
// MeetingCard(common) 레이아웃: aspect-[4/3] 썸네일 + 고정 높이 콘텐츠.
function MeetingListCardSkeleton() {
  return (
    <Card className="h-full gap-0 overflow-hidden rounded-lg border-0 bg-white py-0 shadow-sm">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <CardContent className="flex h-[276px] flex-col gap-3 p-4">
        <Skeleton className="h-5 w-16 rounded-full" />
        <div className="space-y-1.5 pt-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Skeleton className="h-6 w-14 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-12 rounded-full" />
        </div>
        <div className="-mx-4 mt-auto border-t border-[#e6e8ea]" />
        <div className="flex items-center justify-between gap-3 pt-1">
          <Skeleton className="h-3 w-24 rounded-full" />
          <Skeleton className="h-3 w-10" />
        </div>
      </CardContent>
    </Card>
  )
}

// 모임 찾기 목록 그리드 스켈레톤. 그리드 className은 실제 목록과 동일하게 맞춘다.
export function MeetingListSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">모임 목록을 불러오는 중입니다.</span>
      <div
        className="grid gap-x-4 gap-y-9 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        aria-hidden="true"
      >
        {Array.from({ length: count }).map((_, i) => (
          <MeetingListCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

// ── 모임 상세 ─────────────────────────────────────────────
function DetailSectionCardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <Card className="rounded-xl border-0 bg-white shadow-md ring-0">
      <CardContent className="space-y-4 px-5 py-5">
        <Skeleton className="h-6 w-24" />
        <div className="space-y-2">
          {Array.from({ length: lines }).map((_, i) => (
            <Skeleton key={i} className={i === lines - 1 ? "h-4 w-2/3" : "h-4 w-full"} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function MeetingDetailSkeleton() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">모임 상세 정보를 불러오는 중입니다.</span>
      <article className="flex flex-col gap-6" aria-hidden="true">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="size-10 rounded-full" />
          <Skeleton className="size-10 rounded-full" />
        </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* 본문 */}
        <div className="flex flex-col gap-6 lg:col-span-8">
          <Card className="overflow-hidden rounded-xl border-0 bg-white py-0 shadow-md ring-0">
            <CardContent className="p-0">
              <div className="flex flex-col xl:flex-row">
                <Skeleton className="aspect-video w-full rounded-none xl:aspect-[4/4] xl:w-[37%] xl:min-w-[220px]" />
                <div className="flex min-w-0 flex-1 flex-col gap-5 p-5 sm:p-6">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-8 w-1/2" />
                  <div className="mt-auto space-y-3 pt-4">
                    <div className="flex flex-wrap gap-1.5">
                      <Skeleton className="h-6 w-14 rounded-full" />
                      <Skeleton className="h-6 w-16 rounded-full" />
                      <Skeleton className="h-6 w-12 rounded-full" />
                    </div>
                    <Skeleton className="h-4 w-40" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <DetailSectionCardSkeleton lines={4} />
          <DetailSectionCardSkeleton lines={2} />
        </div>

        {/* 사이드바: 신청 카드 + 참여 멤버 */}
        <aside className="flex flex-col gap-6 lg:col-span-4">
          <Card className="rounded-xl border-0 bg-white shadow-md ring-0">
            <CardContent className="space-y-3 px-5 py-5">
              <Skeleton className="h-6 w-28" />
              <div className="space-y-2 pt-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
              <Skeleton className="h-14 w-full rounded-lg" />
            </CardContent>
          </Card>

          <Card className="rounded-xl border-0 bg-white shadow-md ring-0">
            <CardContent className="space-y-3 px-5 py-5">
              <Skeleton className="h-6 w-24" />
              <div className="space-y-3 pt-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="size-9 shrink-0 rounded-full" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
      </article>
    </div>
  )
}

// ── 모임 생성/수정 ────────────────────────────────────────
function FormFieldSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-5 w-28" />
      <Skeleton className="h-12 w-full rounded-lg" />
    </div>
  )
}

// FormSection 외형(rounded-xl border bg-white p-6)을 본뜬 섹션 스켈레톤.
function FormSectionSkeleton({ fields = 3 }: { fields?: number }) {
  return (
    <section className="rounded-xl border border-[#c3c6d7] bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-2">
        <Skeleton className="size-8 rounded-full" />
        <Skeleton className="h-5 w-24" />
      </div>
      <div className="space-y-6">
        {Array.from({ length: fields }).map((_, i) => (
          <FormFieldSkeleton key={i} />
        ))}
      </div>
    </section>
  )
}

export function MeetingFormSkeleton() {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">모임 정보를 불러오는 중입니다.</span>
      <div
        className="flex gap-6 lg:items-start lg:gap-10 xl:gap-12"
        aria-hidden="true"
      >
        <aside className="hidden w-[256px] shrink-0 lg:sticky lg:top-24 lg:block lg:self-start">
          <div className="w-full space-y-4">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-72 w-full rounded-xl" />
          </div>
        </aside>

        <div className="min-w-0 flex-1 space-y-10">
          <FormSectionSkeleton fields={3} />
          <FormSectionSkeleton fields={3} />
          <FormSectionSkeleton fields={2} />
        </div>
      </div>
    </div>
  )
}
