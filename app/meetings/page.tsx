"use client"

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type MouseEvent } from "react"
import Link from "next/link"
import { useInfiniteQuery } from "@tanstack/react-query"
import { ChevronDown, LoaderCircle, Plus, Search } from "lucide-react"
import { useSession } from "next-auth/react"

import LoginDialog from "@/components/common/LoginDialog"
import MeetingCard, {
  mapMeetingSummaryToCardMeeting,
  type Meeting,
} from "@/components/common/MeetingCard"
import { MeetingListSkeleton } from "@/components/meeting/MeetingSkeletons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  useMeetingBookmarkMutation,
  useMeetingBookmarkState,
} from "@/hooks/api/use-meeting-bookmark"
import { queryKeys } from "@/hooks/api/query-keys"
import { ApiFetchError } from "@/lib/api/api-fetch"
import { errorMessage } from "@/lib/api/error"
import {
  fetchMeetings,
  type MeetingListParams,
} from "@/lib/api/meetings"
import { notify } from "@/lib/notify"

const CATEGORY_QUERY_VALUE: Record<string, string> = {
  전체: "ALL",
  프로젝트: "PROJECT",
  해커톤: "HACKATHON",
  공모전: "CONTEST",
}
const SORT_QUERY_VALUE: Record<string, string> = {
  최신순: "latest",
  인기순: "popular",
  마감순: "deadline",
}

type BookmarkOverridesState = {
  scope: string
  values: Record<string, boolean>
}

export default function MeetingsPage() {
  // 입력값(searchInput)은 즉시 갱신하되, 실제 검색어(searchQuery, 쿼리키)는
  // 입력이 멈춘 뒤 디바운스로 커밋한다 → 타이핑마다 API가 호출되던 문제 해결(실시간 유지).
  const [searchInput, setSearchInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("전체")
  const [sortOrder, setSortOrder] = useState("최신순")
  const [bookmarkOverrides, setBookmarkOverrides] = useState<BookmarkOverridesState>({
    scope: "",
    values: {},
  })
  const [loginDialogOpen, setLoginDialogOpen] = useState(false)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const { status: authStatus } = useSession()
  const isAuthenticated = authStatus === "authenticated"

  // 입력이 멈추면 400ms 뒤 검색어를 커밋한다(디바운스). 빠르게 타이핑하면 매번 타이머가
  // 리셋돼 마지막 입력만 1번 호출된다.
  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(searchInput), 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  const categories = ["전체", "프로젝트", "해커톤", "공모전"]
  const listParams = useMemo(
    () => getMeetingListParams(searchQuery, selectedCategory, sortOrder),
    [searchQuery, selectedCategory, sortOrder],
  )
  const bookmarkOverrideScope = useMemo(
    () => `${authStatus}:${listParams.category}:${listParams.keyword ?? ""}:${listParams.sort}`,
    [authStatus, listParams],
  )
  const scopedBookmarkOverrides =
    bookmarkOverrides.scope === bookmarkOverrideScope ? bookmarkOverrides.values : {}
  const {
    data,
    isError,
    isLoading,
    isPending,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    error,
    refetch,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: [...queryKeys.meetings.list, listParams, authStatus],
    initialPageParam: null as number | null,
    queryFn: ({ pageParam }) =>
      fetchMeetings(
        {
          ...listParams,
          cursor: pageParam,
        },
        {
          auth: isAuthenticated,
        },
      ),
    enabled: authStatus !== "loading",
    getNextPageParam: (lastPage) =>
      lastPage.hasNext && lastPage.nextCursor !== null ? lastPage.nextCursor : undefined,
  })
  const meetings = useMemo(
    () =>
      (data?.pages.flatMap((page) => page.meetings) ?? []).map(
        mapMeetingSummaryToCardMeeting,
      ),
    [data?.pages],
  )

  useEffect(() => {
    const target = loadMoreRef.current

    if (!target || !hasNextPage || isFetchingNextPage) {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          fetchNextPage()
        }
      },
      { rootMargin: "240px" },
    )

    observer.observe(target)

    return () => observer.disconnect()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  function handleUnauthenticatedBookmark() {
    notify.info("로그인이 필요한 서비스입니다.")
    setLoginDialogOpen(true)
  }

  function handleBookmarkSuccess(meetingId: string, bookmarked: boolean) {
    setBookmarkOverrides((prev) => ({
      scope: bookmarkOverrideScope,
      values: {
        ...(prev.scope === bookmarkOverrideScope ? prev.values : {}),
        [meetingId]: bookmarked,
      },
    }))
  }

  function handleBookmarkError(error: ApiFetchError) {
    notify.error(errorMessage(error))
  }

  function handleBookmarkUnavailable() {
    notify.error("북마크를 처리할 수 없습니다.")
  }

  function handleCreateMeetingClick(event: MouseEvent<HTMLAnchorElement>) {
    if (isAuthenticated) return
    event.preventDefault()
    notify.info("로그인이 필요한 서비스입니다.")
    setLoginDialogOpen(true)
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-18 px-6 pb-0 pt-10">
        <section className="flex flex-col gap-6">

          <div className="flex flex-col gap-6 rounded-xl border-0 bg-white p-6 shadow-md">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative min-w-0 flex-1">
                <Search
                  className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#737686]"
                  aria-hidden="true"
                />
                <Input
                  type="text"
                  placeholder="기술 스택, 프로젝트명 등으로 검색"
                  value={searchInput}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setSearchInput(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      setSearchQuery(searchInput)
                    }
                  }}
                  className="h-12 rounded-lg border-[#c3c6d7] bg-[#f7f9fb] pl-11 text-base text-[#191c1e] placeholder:text-[#6b7280]"
                />
              </div>
              <Button
                type="button"
                onClick={() => setSearchQuery(searchInput)}
                className="h-12 rounded-lg bg-[#1abcfe] px-8 text-base font-semibold text-white hover:bg-[#0eaeea] sm:w-32"
              >
                검색
              </Button>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-1.5">
              {categories.map((category) => {
                const isActive = selectedCategory === category

                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    className={
                      isActive
                        ? "rounded-full bg-[#3a3f44] px-5 py-1.5 text-sm font-medium tracking-normal text-white shadow-sm"
                        : "rounded-full bg-[#e6e8ea] px-5 py-1.5 text-sm font-medium tracking-normal text-[#434655] transition hover:bg-[#d9dcdf]"
                    }
                  >
                    {category}
                  </button>
                )
              })}
            </div>

            <label className="relative w-fit">
              <span className="sr-only">정렬</span>
              <select
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
                className="h-9 appearance-none rounded-lg border border-[#c3c6d7] bg-[#f2f4f6] py-1.5 pl-3.5 pr-8 text-sm text-[#434655] outline-none transition focus:border-[#004ac6] focus:ring-2 focus:ring-[#004ac6]/20"
              >
                <option>최신순</option>
                <option>인기순</option>
                <option>마감순</option>
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#434655]"
                aria-hidden="true"
              />
            </label>
          </div>

          {isError ? (
            <div className="rounded-xl border border-dashed border-[#c3c6d7] bg-white p-12 text-center text-[#565e74]">
              <p>모임 목록을 불러오지 못했습니다.</p>
              <p className="mt-1 text-sm">{error.message}</p>
              <Button
                type="button"
                variant="outline"
                onClick={() => refetch()}
                className="mt-4"
              >
                다시 불러오기
              </Button>
            </div>
          ) : isPending ? (
            <MeetingListSkeleton />
          ) : meetings.length > 0 ? (
            <>
              <div className="grid gap-x-4 gap-y-9 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {meetings.map((meeting) => {
                  const isBookmarked =
                    scopedBookmarkOverrides[meeting.id] ?? meeting.isBookmarked

                  return (
                    <MeetingListCard
                      key={meeting.id}
                      meeting={{ ...meeting, isBookmarked }}
                      isAuthenticated={isAuthenticated}
                      onUnauthenticatedBookmark={handleUnauthenticatedBookmark}
                      onBookmarkSuccess={handleBookmarkSuccess}
                      onBookmarkError={handleBookmarkError}
                      onBookmarkUnavailable={handleBookmarkUnavailable}
                    />
                  )
                })}
              </div>
              <div ref={loadMoreRef} className="h-8" aria-hidden="true" />
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-[#c3c6d7] bg-white p-12 text-center text-[#565e74]">
              검색 결과가 없습니다. 다른 키워드로 검색해보세요.
            </div>
          )}

          {isFetchingNextPage || (isFetching && !isLoading) ? <LoadingState /> : null}
        </section>

        <div className="sticky bottom-6 z-40 flex justify-end pb-10 sm:bottom-8">
          <Button
            asChild
            size="lg"
            className="h-14 rounded-full bg-blue-600 px-5 text-base text-white shadow-lg hover:bg-blue-700"
          >
            <Link
              href="/meetings/create"
              aria-label="모임 만들기"
              onClick={handleCreateMeetingClick}
            >
              <Plus className="size-5" aria-hidden="true" />
              <span className="hidden sm:inline">모임 만들기</span>
            </Link>
          </Button>
        </div>
      </div>
      <LoginDialog
        open={loginDialogOpen}
        onOpenChange={setLoginDialogOpen}
        showTrigger={false}
      />
    </main>
  )
}

// 명세서 v2의 모임찾기 API는 목데이터 대신 GET /api/meetings를 사용한다.
// 검색어, 카테고리, 정렬은 클라이언트 필터링이 아니라 keyword/category/sort query param으로 전달된다.
// 응답의 nextCursor/hasNext를 useInfiniteQuery에 연결해 8개씩 이어서 불러온다(xl 4열 × 2행).
function getMeetingListParams(
  searchQuery: string,
  selectedCategory: string,
  sortOrder: string,
): MeetingListParams {
  const keyword = searchQuery.trim()

  return {
    size: 8,
    category: CATEGORY_QUERY_VALUE[selectedCategory] ?? "ALL",
    sort: SORT_QUERY_VALUE[sortOrder] ?? "latest",
    ...(keyword ? { keyword } : {}),
  }
}

type MeetingListCardProps = {
  meeting: Meeting
  isAuthenticated: boolean
  onUnauthenticatedBookmark: () => void
  onBookmarkSuccess: (meetingId: string, bookmarked: boolean) => void
  onBookmarkError: (error: ApiFetchError) => void
  onBookmarkUnavailable: () => void
}

function MeetingListCard({
  meeting,
  isAuthenticated,
  onUnauthenticatedBookmark,
  onBookmarkSuccess,
  onBookmarkError,
  onBookmarkUnavailable,
}: MeetingListCardProps) {
  const bookmarkMutation = useMeetingBookmarkMutation()
  const meetingId = Number(meeting.id)
  const bookmarked = useMeetingBookmarkState(
    Number.isFinite(meetingId) ? meetingId : undefined,
    meeting.isBookmarked,
  )

  function handleBookmarkToggle(_meetingId: string, nextBookmarked: boolean) {
    if (!isAuthenticated) {
      onUnauthenticatedBookmark()
      return
    }

    if (!Number.isFinite(meetingId)) {
      onBookmarkUnavailable()
      return
    }

    bookmarkMutation.mutate(
      { meetingId, bookmarked: nextBookmarked },
      {
        onSuccess: () => onBookmarkSuccess(meeting.id, nextBookmarked),
        onError: onBookmarkError,
      },
    )
  }

  return (
    <MeetingCard
      meeting={{ ...meeting, isBookmarked: bookmarked }}
      onBookmarkToggle={handleBookmarkToggle}
      bookmarkDisabled={bookmarkMutation.isPending}
    />
  )
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-[#565e74]">
      <LoaderCircle
        className="size-5 animate-spin text-[#004ac6]"
        aria-hidden="true"
      />
      <span className="text-base font-medium">불러오는 중...</span>
    </div>
  )
}
