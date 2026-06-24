"use client"

import type { ReactNode } from "react"

import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useSession } from "next-auth/react"
import {
  Calendar,
  Check,
  ChevronLeft,
  Clock3,
  Crown,
  Pencil,
  Video,
} from "lucide-react"

import { BookMarkBtn } from "@/components/common/BookMarkBtn"
import LoginDialog from "@/components/common/LoginDialog"
import { MeetingCardImage } from "@/components/common/MeetingCard"
import { MeetingDeadlineBadge } from "@/components/common/MeetingDeadlineBadge"
import { MeetingRecommendationCarousel } from "@/components/common/MeetingRecommendationCarousel"
import { MeetingDetailSkeleton } from "@/components/meeting/MeetingSkeletons"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Badge,
  CategoryBadge,
  HostBadge,
  TechStackBadges,
} from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CATEGORY_LABEL } from "@/constants/category"
import {
  useMeetingBookmarkMutation,
  useMeetingBookmarkState,
} from "@/hooks/api/use-meeting-bookmark"
import { queryKeys } from "@/hooks/api/query-keys"
import { ApiFetchError } from "@/lib/api/api-fetch"
import { errorMessage } from "@/lib/api/error"
import {
  applyMeeting,
  fetchMeetingDetail,
  fetchMeetingMembers,
  normalizeMeetingPositions,
  updateMyMeetingPosition,
  type MeetingDetail as MeetingDetailData,
  type MeetingMember,
} from "@/lib/api/meetings"
import { notify } from "@/lib/notify"
import { cn } from "@/lib/utils"

type MeetingDetailProps = {
  meetingId?: number
}

type DetailPosition = {
  id: number
  job: string
  current: number
  max: number
  isClosed: boolean
  description: string
}

type DetailMember = {
  id: number
  name: string
  job: string
  profileImage: string | null
  isLeader: boolean
}

type MeetingView = {
  title: string
  category: string
  deadline: string
  deadlineDate: string
  isDeadlineToday: boolean
  startDate: string
  duration: string
  meetingSchedule: string
  imageCategory: string
  heroImage: string | null
  description: string
  additionalNotice: string | null
  techStacks: string[]
  isBookmarked: boolean
  isLeader: boolean
  status?: string
  positions: DetailPosition[]
  members: DetailMember[]
}

type BookmarkOverrideState = {
  meetingId: number
  bookmarked: boolean
} | null

type SectionTitleProps = {
  title: string
}

function SectionTitle({ title }: SectionTitleProps) {
  return (
    <h2 className="text-lg font-bold tracking-normal text-[#191c1e]">{title}</h2>
  )
}

type InfoRowProps = {
  label: string
  value: string
  icon?: ReactNode
}

function InfoRow({ label, value, icon }: InfoRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#eceef0] py-4 last:border-b-0">
      <div className="flex items-center gap-2 text-sm font-medium tracking-normal text-[#434655]">
        {icon ? <span className="text-[#737686]">{icon}</span> : null}
        {label}
      </div>
      <p className="text-right text-base font-medium text-[#191c1e]">{value}</p>
    </div>
  )
}

type PositionRequirementProps = {
  position: DetailPosition
}

function PositionRequirement({ position }: PositionRequirementProps) {
  const isFull = position.current >= position.max
  const remainingCount = Math.max(position.max - position.current, 0)

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-[#c3c6d7] p-4 sm:flex-row sm:items-center sm:justify-between",
        isFull && "bg-[#f2f4f6] opacity-70",
      )}
    >
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-base font-bold text-[#191c1e]">{position.job}</p>
          <Badge
            className={cn(
              "h-auto rounded-full px-2 py-1 text-xs",
              isFull
                ? "border border-[#d7dae5] bg-white text-[#737686]"
                : "border border-blue-100 bg-blue-50 text-blue-600",
            )}
          >
            {isFull ? "모집 완료" : `${remainingCount}명 모집 중`}
          </Badge>
        </div>
        <p className="text-sm leading-5 text-[#434655]">{position.description}</p>
      </div>
      <p
        className={cn(
          "shrink-0 text-sm font-medium tracking-normal",
          isFull ? "text-[#737686]" : "text-blue-500",
        )}
      >
        {position.current} / {position.max}명
      </p>
    </div>
  )
}

type JoinMeetingDialogProps = {
  open: boolean
  positions: DetailPosition[]
  selectedPositionId: number | null
  currentPositionId: number | null
  errorMessage: string | null
  isPending: boolean
  submitLabel: string
  onOpenChange: (open: boolean) => void
  onSelectPosition: (positionId: number) => void
  onSubmit: () => void
}

function JoinMeetingDialog({
  open,
  positions,
  selectedPositionId,
  currentPositionId,
  errorMessage,
  isPending,
  submitLabel,
  onOpenChange,
  onSelectPosition,
  onSubmit,
}: JoinMeetingDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>참여할 포지션 선택</DialogTitle>
          <DialogDescription>
            참여할 포지션을 선택한 뒤 모임 참여를 완료해주세요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 pt-2">
          {positions.map((position) => {
            const remainingCount = Math.max(position.max - position.current, 0)
            const selected = selectedPositionId === position.id
            const isFull = isPositionFull(position)
            const isCurrent = currentPositionId === position.id
            const isDisabled = isPending || (isFull && !isCurrent)

            return (
              <label
                key={position.id}
                className={cn(
                  "flex items-start gap-3 rounded-lg border border-[#c3c6d7] p-4 transition-colors",
                  isDisabled ? "cursor-default bg-[#f7f9fb] opacity-70" : "cursor-pointer",
                  selected && "border-[#1abcfe] bg-[#1abcfe]/10",
                )}
              >
                <input
                  type="radio"
                  name="meeting-position"
                  value={position.id}
                  checked={selected}
                  onChange={() => {
                    if (!isDisabled) onSelectPosition(position.id)
                  }}
                  className="sr-only"
                  aria-disabled={isDisabled}
                  tabIndex={isDisabled ? -1 : undefined}
                />
                <span
                  aria-hidden="true"
                  className={cn(
                    "mt-1 flex size-5 shrink-0 items-center justify-center rounded-full border border-[#c3c6d7] bg-white transition-colors",
                    selected && "border-[#1abcfe] bg-[#1abcfe]",
                  )}
                >
                  {selected ? <Check className="size-3.5 text-white" /> : null}
                </span>
                <span className="min-w-0 flex-1 space-y-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-[#191c1e]">{position.job}</span>
                    <Badge
                      className={cn(
                        "h-auto rounded-full px-2 py-1 text-xs",
                        isFull
                          ? "border border-[#d7dae5] bg-white text-[#737686]"
                          : "border border-blue-100 bg-blue-50 text-blue-600",
                      )}
                    >
                      {isCurrent
                        ? "현재 참여 중"
                        : isFull
                          ? "모집 완료"
                          : `${remainingCount}명 모집 중`}
                    </Badge>
                  </span>
                  <span className="block text-sm leading-5 text-[#434655]">
                    {position.description}
                  </span>
                </span>
              </label>
            )
          })}
        </div>

        {errorMessage ? (
          <p className="rounded-md border border-destructive/40 bg-destructive/5 p-2 text-xs text-destructive">
            {errorMessage}
          </p>
        ) : null}

        <div className="pt-2">
          <Button
            className="h-12 w-full rounded-lg bg-[#1abcfe] text-base font-medium text-white hover:bg-[#0eaeea] disabled:cursor-default"
            onClick={onSubmit}
            disabled={isPending || selectedPositionId === null}
          >
            {isPending ? "처리 중..." : submitLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

type MemberRowProps = {
  member: DetailMember
}

function MemberRow({ member }: MemberRowProps) {
  const fallback = member.name.trim().charAt(0) || "?"

  return (
    <div className="flex items-center gap-4 rounded-lg p-2">
      <div className="relative">
        <Avatar className={cn("size-10", member.isLeader ? "bg-blue-100" : "bg-[#e0e3e5]")}>
          {member.profileImage ? (
            <AvatarImage src={member.profileImage} alt={`${member.name} profile`} />
          ) : null}
          <AvatarFallback>{fallback}</AvatarFallback>
        </Avatar>
        {member.isLeader ? (
          <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-yellow-100 text-yellow-500">
            <Crown className="size-3" />
          </span>
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium tracking-normal text-[#191c1e]">
            {member.name}
          </p>
          {member.isLeader ? <HostBadge className="h-auto px-2 py-0.5 text-[10px]" /> : null}
        </div>
        <p className="truncate text-xs text-[#434655]">{member.job}</p>
      </div>
    </div>
  )
}

export function MeetingDetail({ meetingId }: MeetingDetailProps) {
  const queryClient = useQueryClient()
  const { data: session, status: authStatus } = useSession()
  const [joinDialogOpen, setJoinDialogOpen] = useState(false)
  const [loginDialogOpen, setLoginDialogOpen] = useState(false)
  const [selectedPositionId, setSelectedPositionId] = useState<number | null>(null)
  const [joinErrorMessage, setJoinErrorMessage] = useState<string | null>(null)
  const [bookmarkOverride, setBookmarkOverride] = useState<BookmarkOverrideState>(null)
  const canFetch = typeof meetingId === "number" && Number.isFinite(meetingId)
  const requestAuth = authStatus === "authenticated"
  const bookmarkMutation = useMeetingBookmarkMutation()
  const detailQuery = useQuery({
    queryKey: canFetch
      ? [...queryKeys.meetings.detail(meetingId), authStatus]
      : ["meetings", "detail", "missing", authStatus],
    queryFn: () => fetchMeetingDetail(meetingId as number, { auth: requestAuth }),
    enabled: canFetch && authStatus !== "loading",
  })
  const membersQuery = useQuery({
    queryKey: canFetch
      ? [...queryKeys.meetings.members(meetingId), authStatus]
      : ["meetings", "members", "missing", authStatus],
    queryFn: () => fetchMeetingMembers(meetingId as number, { auth: requestAuth }),
    enabled: canFetch && authStatus !== "loading",
  })
  const detailMembers = detailQuery.data?.members
  const displayedMembers = useMemo(
    () => membersQuery.data?.members ?? detailMembers ?? [],
    [detailMembers, membersQuery.data?.members],
  )
  const meeting = useMemo(() => {
    if (!detailQuery.data) {
      return null
    }

    return mapMeetingDetailToView(detailQuery.data, displayedMembers)
  }, [detailQuery.data, displayedMembers])
  const cachedBookmarked = useMeetingBookmarkState(
    authStatus === "authenticated" && canFetch ? meetingId : undefined,
    meeting?.isBookmarked,
  )
  const displayedBookmarked =
    authStatus === "authenticated" && canFetch && bookmarkOverride?.meetingId === meetingId
      ? bookmarkOverride.bookmarked
      : cachedBookmarked
  const showMembersLoading = membersQuery.isLoading && displayedMembers.length === 0
  const showMembersError = membersQuery.isError && displayedMembers.length === 0
  const openPositions = useMemo(() => {
    return meeting?.positions.filter((position) => !isPositionFull(position)) ?? []
  }, [meeting?.positions])
  const sessionUserId = session?.user?.id ? String(session.user.id) : null
  const currentMember = useMemo(() => {
    if (!sessionUserId) {
      return null
    }

    const member = displayedMembers.find((item) => String(item.id) === sessionUserId)

    if (member) {
      return member
    }

    return meeting?.isLeader
      ? displayedMembers.find((item) => item.isLeader) ?? null
      : null
  }, [displayedMembers, meeting?.isLeader, sessionUserId])
  const currentPositionId = useMemo(() => {
    const positionName = currentMember?.positionName

    if (!positionName || !meeting) {
      return null
    }

    return meeting.positions.find((position) => position.job === positionName)?.id ?? null
  }, [currentMember?.positionName, meeting])
  const isMeetingParticipant = Boolean(currentMember || meeting?.isLeader)
  const canJoinByStatus = !meeting?.status || meeting.status === "RECRUITING"
  const joinMutation = useMutation({
    mutationFn: (positionId: number) =>
      isMeetingParticipant
        ? updateMyMeetingPosition(meetingId as number, { positionId })
        : applyMeeting(meetingId as number, { positionId }),
    onSuccess: async () => {
      notify.success(
        isMeetingParticipant
          ? "참여 포지션이 수정되었습니다."
          : "모임 참여가 완료되었습니다.",
      )
      setJoinDialogOpen(false)
      setSelectedPositionId(null)
      setJoinErrorMessage(null)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.meetings.detail(meetingId as number) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.meetings.members(meetingId as number) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.meetings.mineAll }),
      ])
    },
    onError: (error) => {
      setJoinErrorMessage(
        error instanceof ApiFetchError
          ? errorMessage(error)
          : isMeetingParticipant
            ? "참여 포지션 수정에 실패했습니다."
            : "모임 참여에 실패했습니다.",
      )
    },
  })

  function handleBookmarkToggle(bookmarked: boolean) {
    if (authStatus !== "authenticated") {
      notify.info("로그인이 필요한 서비스입니다.")
      setLoginDialogOpen(true)
      return
    }

    if (!canFetch) {
      notify.error("북마크를 처리할 수 없습니다.")
      return
    }

    const nextOverride = { meetingId: meetingId as number, bookmarked }
    const previousOverride = bookmarkOverride
    setBookmarkOverride(nextOverride)

    bookmarkMutation.mutate(
      { meetingId: meetingId as number, bookmarked },
      {
        onError: (error) => {
          setBookmarkOverride(previousOverride)
          notify.error(
            error instanceof ApiFetchError
              ? errorMessage(error)
              : "북마크 변경에 실패했습니다.",
          )
        },
      },
    )
  }

  function handleJoinClick() {
    if (authStatus !== "authenticated") {
      notify.info("로그인이 필요한 서비스입니다.")
      setLoginDialogOpen(true)
      return
    }

    setJoinErrorMessage(null)
    setSelectedPositionId(currentPositionId ?? openPositions[0]?.id ?? null)
    setJoinDialogOpen(true)
  }

  function handleJoinDialogOpenChange(open: boolean) {
    setJoinDialogOpen(open)

    if (!open) {
      setSelectedPositionId(null)
      setJoinErrorMessage(null)
    }
  }

  function handleJoinSubmit() {
    if (selectedPositionId === null) {
      setJoinErrorMessage("참여할 포지션을 선택해주세요.")
      return
    }

    if (isMeetingParticipant && selectedPositionId === currentPositionId) {
      setJoinDialogOpen(false)
      setSelectedPositionId(null)
      setJoinErrorMessage(null)
      return
    }

    if (
      selectedPositionId !== currentPositionId &&
      openPositions.every((position) => position.id !== selectedPositionId)
    ) {
      setJoinErrorMessage("모집 중인 포지션을 선택해주세요.")
      return
    }

    joinMutation.mutate(selectedPositionId)
  }

  if (!canFetch) {
    return (
      <Card className="rounded-xl border-0 bg-white shadow-md ring-0">
        <CardContent className="p-10 text-center text-[#434655]">
          상세 정보를 불러올 모임을 선택해주세요.
        </CardContent>
      </Card>
    )
  }

  if (detailQuery.isLoading) {
    return <MeetingDetailSkeleton />
  }

  if (detailQuery.isError || !meeting) {
    const detailErrorMessage =
      detailQuery.error instanceof ApiFetchError
        ? errorMessage(detailQuery.error)
        : "모임 상세 정보를 불러오지 못했습니다."

    return (
      <Card className="rounded-xl border-0 bg-white shadow-md ring-0">
        <CardContent className="space-y-2 p-10 text-center text-[#434655]">
          <p>모임 상세 정보를 불러오지 못했습니다.</p>
          <p className="text-sm text-[#737686]">{detailErrorMessage}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <article className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <Button
          asChild
          size="icon"
          variant="ghost"
          className="size-10 rounded-full bg-white text-[#191c1e] shadow-sm hover:bg-white hover:text-[#191c1e]"
        >
          <Link href="/meetings" aria-label="모임 찾기 페이지로 이동" title="모임 찾기">
            <ChevronLeft className="size-5" aria-hidden="true" />
          </Link>
        </Button>
        {meeting.isLeader ? (
          <Button
            asChild
            size="icon"
            className="size-10 rounded-full bg-[#3a3f44] text-sm font-medium text-white hover:bg-[#30353a] sm:h-10 sm:w-auto sm:gap-2 sm:px-4"
          >
            <Link href={`/meetings/${meetingId}/edit`} aria-label="모임 수정" title="모임 수정">
              <Pencil className="size-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">모임 수정</span>
            </Link>
          </Button>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-8">
          <Card className="overflow-hidden rounded-xl border-0 bg-white py-0 shadow-md ring-0">
            <CardContent className="p-0">
              <div className="relative flex flex-col xl:flex-row">
                <MeetingCardImage
                  category={meeting.imageCategory}
                  imageUrl={meeting.heroImage}
                  title={meeting.title}
                  sizes="(min-width: 1280px) 300px, (min-width: 1024px) 36vw, 100vw"
                  showBookmark={false}
                  className="relative aspect-video w-full overflow-hidden bg-[#f2f4f6] xl:aspect-[4/4] xl:w-[37%] xl:min-w-[220px]"
                />
                <div className="flex min-w-0 flex-1 flex-col gap-5 p-5 sm:p-6 xl:gap-6 xl:pr-14">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <CategoryBadge
                          category={meeting.category}
                          className="h-auto px-3 py-1 text-xs"
                        />
                        {meeting.isDeadlineToday ? (
                          <MeetingDeadlineBadge
                            deadline={meeting.deadlineDate}
                            isDeadlineToday
                            className="rounded-full border border-red-110 bg-red-50 px-2.5 py-1 text-xs font-bold [&>svg]:size-3"
                          />
                        ) : null}
                      </div>
                      <BookMarkBtn
                        bookmarked={displayedBookmarked}
                        onToggle={handleBookmarkToggle}
                        disabled={bookmarkMutation.isPending}
                        className="size-9 p-2 shadow-sm"
                      />
                    </div>
                    <h1 className="max-w-xl text-2xl font-bold leading-8 tracking-normal text-[#191c1e] sm:text-[28px] sm:leading-9">
                      {meeting.title}
                    </h1>
                  </div>
                  <div className="mt-auto space-y-1">
                    {meeting.techStacks.length > 0 ? (
                      <TechStackBadges
                        techStacks={meeting.techStacks}
                        className="gap-1.5"
                      />
                    ) : null}
                    <p className="pt-3 text-sm leading-5 text-[#737686]">
                      모집 마감일 : {meeting.deadline}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-0 bg-white shadow-md ring-0">
            <CardContent className="space-y-4 px-5 py-3">
              <SectionTitle title="모임소개" />
              <div className="space-y-3 text-base leading-7 text-[#434655]">
                {meeting.description.split("\n").map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </CardContent>
          </Card>

          {meeting.additionalNotice ? (
            <Card className="rounded-xl border-0 bg-white shadow-md ring-0">
              <CardContent className="space-y-4 px-5 py-3">
                <SectionTitle title="추가 안내" />
                <div className="space-y-3 text-base leading-7 text-[#434655]">
                  {meeting.additionalNotice.split("\n").map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card className="rounded-xl border-0 bg-white shadow-md ring-0">
            <CardContent className="space-y-4 px-5 py-3">
              <SectionTitle title="상세 모집 요건" />
              <div className="space-y-3">
                {meeting.positions.map((position) => (
                  <PositionRequirement key={position.id} position={position} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="flex flex-col gap-6 lg:col-span-4">
          <div className="sticky top-6 flex flex-col gap-6">
            <Card className="rounded-xl border-0 bg-white shadow-md ring-0">
              <CardContent className="space-y-4 px-5 py-3">
                <h2 className="text-lg font-bold tracking-normal text-[#191c1e]">진행 정보</h2>
                <div>
                  <InfoRow
                    label="시작 예정일"
                    value={meeting.startDate}
                    icon={<Calendar className="size-4" />}
                  />
                  <InfoRow
                    label="진행 기간"
                    value={meeting.duration}
                    icon={<Clock3 className="size-4" />}
                  />
                  <InfoRow
                    label="회의 일정"
                    value={meeting.meetingSchedule}
                    icon={<Video className="size-4" />}
                  />
                </div>

                <Button
                  className="h-14 w-full rounded-lg bg-[#1abcfe] text-lg font-medium text-white shadow-lg shadow-[#1abcfe]/18 hover:bg-[#0eaeea] hover:shadow-xl hover:shadow-[#1abcfe]/23 disabled:cursor-default"
                  onClick={handleJoinClick}
                  disabled={(!isMeetingParticipant && openPositions.length === 0) || !canJoinByStatus}
                >
                  {!canJoinByStatus
                    ? "모집 마감"
                    : isMeetingParticipant
                      ? "참여 포지션 변경"
                      : openPositions.length === 0
                      ? "모집 완료"
                      : "참가하기"}
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-xl border-0 bg-white shadow-md ring-0">
              <CardContent className="space-y-3 px-5 py-3">
                <SectionTitle title="참여 멤버" />
                <div className="space-y-2">
                  {showMembersLoading ? (
                    <p className="px-2 text-sm text-[#737686]">참여 멤버를 불러오는 중입니다.</p>
                  ) : showMembersError ? (
                    <p className="px-2 text-sm text-[#737686]">참여 멤버를 불러오지 못했습니다.</p>
                  ) : meeting.members.length > 0 ? (
                    meeting.members.slice(0, 4).map((member) => (
                      <MemberRow key={member.id} member={member} />
                    ))
                  ) : (
                    <p className="px-2 text-sm text-[#737686]">아직 참여 멤버가 없습니다.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </aside>
      </div>

      <section className="pt-8">
        <MeetingRecommendationCarousel currentMeetingId={meetingId} />
      </section>

      <JoinMeetingDialog
        open={joinDialogOpen}
        positions={meeting.positions}
        selectedPositionId={selectedPositionId}
        currentPositionId={currentPositionId}
        errorMessage={joinErrorMessage}
        isPending={joinMutation.isPending}
        submitLabel={isMeetingParticipant ? "변경 완료" : "참가 완료"}
        onOpenChange={handleJoinDialogOpenChange}
        onSelectPosition={setSelectedPositionId}
        onSubmit={handleJoinSubmit}
      />
      <LoginDialog
        open={loginDialogOpen}
        onOpenChange={setLoginDialogOpen}
        showTrigger={false}
      />
    </article>
  )
}

function mapMeetingDetailToView(meeting: MeetingDetailData, members: MeetingMember[]): MeetingView {
  const description = meeting.description ?? meeting.introduction ?? meeting.content ?? "모임 소개가 없습니다."
  const positions = normalizeMeetingPositions(meeting.positions)

  return {
    title: meeting.title ?? "제목 없는 모임",
    category: CATEGORY_LABEL[meeting.category] ?? meeting.category ?? "프로젝트",
    deadline: formatDisplayDate(meeting.deadline),
    deadlineDate: meeting.deadline,
    isDeadlineToday: isMeetingDeadlineToday(meeting.deadline, meeting.isDeadlineToday),
    startDate: formatDisplayDate(meeting.startDate),
    duration: meeting.expectedDuration ?? meeting.duration ?? "-",
    meetingSchedule: meeting.meetingSchedule ?? meeting.meetingType ?? "-",
    imageCategory: meeting.category ?? "PROJECT",
    heroImage: meeting.thumbnailUrl,
    description,
    additionalNotice: meeting.additionalNotice?.trim() || null,
    techStacks: meeting.techStacks ?? [],
    isBookmarked: meeting.isBookmarked ?? false,
    isLeader: meeting.isLeader ?? false,
    status: meeting.status,
    positions: positions.map((position) => ({
      id: position.id,
      job: position.name,
      current: position.currentCount,
      max: position.recruitCount,
      isClosed: position.isClosed ?? false,
      description: position.description ?? "상세 모집 요건이 없습니다.",
    })),
    members: members.map(mapMeetingMemberToView),
  }
}

function isPositionFull(position: DetailPosition) {
  return position.isClosed || position.current >= position.max
}

function mapMeetingMemberToView(member: MeetingMember): DetailMember {
  return {
    id: member.id,
    name: member.nickname,
    job: member.positionName ?? member.job ?? "역할 미정",
    profileImage: member.profileImage,
    isLeader: member.isLeader,
  }
}

function isMeetingDeadlineToday(deadline: string, fallback?: boolean) {
  if (fallback) {
    return true
  }

  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(deadline)

  if (!dateOnlyMatch) {
    return false
  }

  const now = new Date()

  return (
    Number(dateOnlyMatch[1]) === now.getFullYear() &&
    Number(dateOnlyMatch[2]) === now.getMonth() + 1 &&
    Number(dateOnlyMatch[3]) === now.getDate()
  )
}

function formatDisplayDate(date: string | null | undefined) {
  if (!date) {
    return "-"
  }

  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  const parsedDate = dateOnlyMatch
    ? new Date(
        Number(dateOnlyMatch[1]),
        Number(dateOnlyMatch[2]) - 1,
        Number(dateOnlyMatch[3]),
      )
    : new Date(date)

  if (Number.isNaN(parsedDate.getTime())) {
    return date
  }

  const year = parsedDate.getFullYear()
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0")
  const day = String(parsedDate.getDate()).padStart(2, "0")

  return `${year}.${month}.${day}`
}

