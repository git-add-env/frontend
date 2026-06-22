"use client"

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type MouseEvent } from "react"
import Link from "next/link"
import { useInfiniteQuery } from "@tanstack/react-query"
import { ChevronDown, LoaderCircle, Plus, Search } from "lucide-react"
import { useSession } from "next-auth/react"

import LoginDialog from "@/components/common/LoginDialog"
import MeetingCard, { type Meeting } from "@/components/common/MeetingCard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CATEGORY_LABEL } from "@/constants/category"
import { useMeetingBookmarkMutation } from "@/hooks/api/use-meeting-bookmark"
import { queryKeys } from "@/hooks/api/query-keys"
import { ApiFetchError } from "@/lib/api/api-fetch"
import { errorMessage } from "@/lib/api/error"
import {
  fetchMeetings,
  type MeetingListParams,
  type MeetingSummary,
} from "@/lib/api/meetings"
import { notify } from "@/lib/notify"

const FALLBACK_MEETING_IMAGE_URL = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3"
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
  const bookmarkMutation = useMeetingBookmarkMutation()
  const isAuthenticated = authStatus === "authenticated"

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

  function handleBookmarkToggle(meetingId: string, bookmarked: boolean) {
    if (!isAuthenticated) {
      notify.info("로그인이 필요한 서비스입니다.")
      setLoginDialogOpen(true)
      return
    }

    const parsedMeetingId = Number(meetingId)

    if (!Number.isFinite(parsedMeetingId)) {
      notify.error("북마크를 처리할 수 없습니다.")
      return
    }

    bookmarkMutation.mutate(
      { meetingId: parsedMeetingId, bookmarked },
      {
        onSuccess: () => {
          setBookmarkOverrides((prev) => ({
            scope: bookmarkOverrideScope,
            values: {
              ...(prev.scope === bookmarkOverrideScope ? prev.values : {}),
              [meetingId]: bookmarked,
            },
          }))
        },
        onError: (error) => {
          notify.error(
            error instanceof ApiFetchError
              ? errorMessage(error)
              : "북마크 변경에 실패했습니다.",
          )
        },
      },
    )
  }

  function handleCreateMeetingClick(event: MouseEvent<HTMLAnchorElement>) {
    if (isAuthenticated) {
      return
    }

    event.preventDefault()
    notify.info("로그인이 필요한 서비스입니다.")
    setLoginDialogOpen(true)
  }

  return (
    <main className="min-h-screen bg-[#f7f9fb]">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-18 px-6 py-10">
        <section className="flex flex-col gap-6">
          {/* <div>
            <h1 className="text-[32px] font-medium leading-10 tracking-normal text-[#191c1e]">
              함께 성장할 팀원을 찾아보세요
            </h1>
            <p className="mt-1 text-lg leading-7 text-[#434655]">
              당신의 열정을 함께 나눌 프로젝트와 동료들이 기다리고 있습니다.
            </p>
          </div> */}

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
                  value={searchQuery}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    setSearchQuery(event.target.value)
                  }
                  className="h-12 rounded-lg border-[#c3c6d7] bg-[#f7f9fb] pl-11 text-base text-[#191c1e] placeholder:text-[#6b7280]"
                />
              </div>
              <Button
                type="button"
                className="h-12 rounded-lg bg-[#1abcfe] px-8 text-base font-medium text-white hover:bg-[#0eaeea] sm:w-32"
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
          ) : isLoading ? (
            <LoadingState />
          ) : meetings.length > 0 ? (
            <>
              <div className="grid gap-x-4 gap-y-9 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {meetings.map((meeting) => {
                  const isBookmarked =
                    scopedBookmarkOverrides[meeting.id] ?? meeting.isBookmarked

                  return (
                    <MeetingCard
                      key={meeting.id}
                      meeting={{ ...meeting, isBookmarked }}
                      onBookmarkToggle={handleBookmarkToggle}
                      bookmarkDisabled={bookmarkMutation.isPending}
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
      </div>

      <Button
        asChild
        size="lg"
        className="fixed bottom-6 right-6 z-40 h-14 rounded-full bg-blue-600 px-5 text-base text-white shadow-lg hover:bg-blue-700 sm:bottom-8 sm:right-[max(2rem,calc((100vw-1280px)/2+1.5rem))]"
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
// 응답의 nextCursor/hasNext를 useInfiniteQuery에 연결해 6개씩 이어서 불러온다.
function getMeetingListParams(
  searchQuery: string,
  selectedCategory: string,
  sortOrder: string,
): MeetingListParams {
  const keyword = searchQuery.trim()

  return {
    size: 6,
    category: CATEGORY_QUERY_VALUE[selectedCategory] ?? "ALL",
    sort: SORT_QUERY_VALUE[sortOrder] ?? "latest",
    ...(keyword ? { keyword } : {}),
  }
}

function mapMeetingSummaryToCardMeeting(meeting: MeetingSummary): Meeting {
  return {
    id: String(meeting.meetingId),
    title: meeting.title,
    date: formatDisplayDate(meeting.deadline),
    deadline: formatDisplayDate(meeting.deadline),
    deadlineDate: meeting.deadline,
    status: getCardStatus(meeting.status),
    category: CATEGORY_LABEL[meeting.category] ?? meeting.category,
    memberCount: meeting.recruitSummary.currentCount,
    maxMembers: meeting.recruitSummary.totalCount,
    techStacks: meeting.techStacks,
    jobs: meeting.positions.map((position) => ({
      job: position.name,
      current: position.currentCount,
      max: position.recruitCount,
    })),
    imageUrl: meeting.thumbnailUrl ?? FALLBACK_MEETING_IMAGE_URL,
    isBookmarked: meeting.isBookmarked,
    isClosingToday: meeting.isDeadlineToday,
  }
}

function getCardStatus(status: string | undefined): Meeting["status"] {
  if (status === "COMPLETED") {
    return "마감"
  }

  if (status === "ACTIVE") {
    return "개설확정"
  }

  return "모집중"
}

function formatDisplayDate(date: string) {
  const parsedDate = new Date(date)

  if (Number.isNaN(parsedDate.getTime())) {
    return date
  }

  const year = parsedDate.getFullYear()
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0")
  const day = String(parsedDate.getDate()).padStart(2, "0")

  return `${year}.${month}.${day}`
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
