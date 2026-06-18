"use client"

import type { ReactNode } from "react"

import { useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { useSession } from "next-auth/react"
import {
  BookOpenText,
  Calendar,
  ChevronRight,
  ClipboardList,
  Clock3,
  Crown,
  LoaderCircle,
  Users,
  Video,
} from "lucide-react"

import { BookMarkBtn } from "@/components/common/BookMarkBtn"
import LoginDialog from "@/components/common/LoginDialog"
import { MeetingCardImage } from "@/components/common/MeetingCard"
import MeetingRecommendationCarousel from "@/components/common/MeetingRecommendationCarousel"
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
import { Progress } from "@/components/ui/progress"
import { CATEGORY_LABEL } from "@/constants/category"
import { queryKeys } from "@/hooks/api/query-keys"
import { ApiFetchError } from "@/lib/api/api-fetch"
import { errorMessage } from "@/lib/api/error"
import {
  applyMeeting,
  fetchMeetingDetail,
  fetchMeetingMembers,
  type MeetingDetail as MeetingDetailData,
  type MeetingMember,
} from "@/lib/api/meetings"
import { notify } from "@/lib/notify"
import { cn } from "@/lib/utils"

const FALLBACK_MEETING_IMAGE_URL = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3"

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
  startDate: string
  duration: string
  meetingSchedule: string
  memberCount: number
  maxMembers: number
  heroImage: string
  description: string
  techStacks: string[]
  isBookmarked: boolean
  isLeader: boolean
  status?: string
  positions: DetailPosition[]
  members: DetailMember[]
}

type SectionTitleProps = {
  icon: ReactNode
  title: string
}

function SectionTitle({ icon, title }: SectionTitleProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-blue-500">{icon}</span>
      <h2 className="text-xl font-medium tracking-normal text-[#191c1e]">{title}</h2>
    </div>
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
          <p className="text-base font-medium text-[#191c1e]">{position.job}</p>
          <Badge
            variant={isFull ? "muted" : "recruiting"}
            className="h-auto rounded-full px-2 py-1 text-xs"
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
        모집 인원: {position.max}명
      </p>
    </div>
  )
}

type RecruitmentStatusProps = {
  position: DetailPosition
}

function RecruitmentStatus({ position }: RecruitmentStatusProps) {
  const isFull = isPositionFull(position)

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 rounded-lg bg-[#eceef0] px-4 py-2",
        isFull && "opacity-60",
      )}
    >
      <p className="text-sm font-medium text-[#191c1e]">{position.job}</p>
      <p className={cn("text-sm font-medium text-blue-500", isFull && "text-[#737686]")}>
        {position.current} / {position.max}
        {isFull ? " (마감)" : ""}
      </p>
    </div>
  )
}

type JoinMeetingDialogProps = {
  open: boolean
  positions: DetailPosition[]
  selectedPositionId: number | null
  errorMessage: string | null
  isPending: boolean
  onOpenChange: (open: boolean) => void
  onSelectPosition: (positionId: number) => void
  onSubmit: () => void
}

function JoinMeetingDialog({
  open,
  positions,
  selectedPositionId,
  errorMessage,
  isPending,
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

        <div className="space-y-2">
          {positions.map((position) => {
            const remainingCount = Math.max(position.max - position.current, 0)
            const selected = selectedPositionId === position.id

            return (
              <label
                key={position.id}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-lg border border-[#c3c6d7] p-4 transition-colors",
                  selected && "border-blue-400 bg-blue-50",
                )}
              >
                <input
                  type="radio"
                  name="meeting-position"
                  value={position.id}
                  checked={selected}
                  onChange={() => onSelectPosition(position.id)}
                  className="mt-1 size-4 accent-blue-500"
                  disabled={isPending}
                />
                <span className="min-w-0 flex-1 space-y-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-[#191c1e]">{position.job}</span>
                    <Badge variant="recruiting" className="h-auto rounded-full px-2 py-1 text-xs">
                      {remainingCount}명 모집 중
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

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isPending}>
            닫기
          </Button>
          <Button onClick={onSubmit} disabled={isPending || selectedPositionId === null}>
            {isPending ? "참여 중..." : "참여하기"}
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
          {member.isLeader ? <HostBadge className="h-auto rounded px-2 py-0.5 text-[10px]" /> : null}
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
  const canFetch = typeof meetingId === "number" && Number.isFinite(meetingId)
  const detailAuth = authStatus === "authenticated"
  const detailQuery = useQuery({
    queryKey: canFetch
      ? [...queryKeys.meetings.detail(meetingId), authStatus]
      : ["meetings", "detail", "missing", authStatus],
    queryFn: () => fetchMeetingDetail(meetingId as number, { auth: detailAuth }),
    enabled: canFetch && authStatus !== "loading",
  })
  const membersQuery = useQuery({
    queryKey: canFetch ? queryKeys.meetings.members(meetingId) : ["meetings", "members", "missing"],
    queryFn: () => fetchMeetingMembers(meetingId as number, { auth: false }),
    enabled: canFetch,
  })
  const meeting = useMemo(() => {
    if (!detailQuery.data) {
      return null
    }

    return mapMeetingDetailToView(detailQuery.data, membersQuery.data?.members ?? [])
  }, [detailQuery.data, membersQuery.data?.members])
  const openPositions = useMemo(() => {
    return meeting?.positions.filter((position) => !isPositionFull(position)) ?? []
  }, [meeting?.positions])
  const canJoinByStatus = !meeting?.status || meeting.status === "RECRUITING"
  const currentUserId = session?.user?.id
  const isLeaderByMembers =
    authStatus === "authenticated" &&
    currentUserId !== undefined &&
    meeting?.members.some(
      (member) => member.isLeader && String(member.id) === String(currentUserId),
    ) === true
  const isCurrentUserLeader = meeting?.isLeader === true || isLeaderByMembers
  const isCheckingLeader = authStatus === "authenticated" && membersQuery.isLoading
  const joinMutation = useMutation({
    mutationFn: (positionId: number) => applyMeeting(meetingId as number, { positionId }),
    onSuccess: async () => {
      notify.success("모임 참여가 완료되었습니다.")
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
        error instanceof ApiFetchError ? errorMessage(error) : "모임 참여에 실패했습니다.",
      )
    },
  })

  function handleJoinClick() {
    if (authStatus !== "authenticated") {
      notify.info("로그인이 필요한 서비스입니다.")
      setLoginDialogOpen(true)
      return
    }

    setJoinErrorMessage(null)
    setSelectedPositionId(openPositions[0]?.id ?? null)
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

    joinMutation.mutate(selectedPositionId)
  }

  if (!canFetch) {
    return (
      <Card className="rounded-xl border-[#c3c6d7] bg-white shadow-sm">
        <CardContent className="p-10 text-center text-[#434655]">
          상세 정보를 불러올 모임을 선택해주세요.
        </CardContent>
      </Card>
    )
  }

  if (detailQuery.isLoading) {
    return <LoadingState />
  }

  if (detailQuery.isError || !meeting) {
    return (
      <Card className="rounded-xl border-[#c3c6d7] bg-white shadow-sm">
        <CardContent className="p-10 text-center text-[#434655]">
          모임 상세 정보를 불러오지 못했습니다.
        </CardContent>
      </Card>
    )
  }

  return (
    <article className="flex flex-col gap-6">
      <nav className="flex flex-wrap items-center gap-1 text-sm font-medium tracking-normal text-[#434655]">
        <span>Home</span>
        <ChevronRight className="size-4" aria-hidden="true" />
        <span>모임찾기</span>
        <ChevronRight className="size-4" aria-hidden="true" />
        <span className="text-blue-500">프로젝트 상세</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-8">
          <Card className="overflow-hidden rounded-xl border-[#c3c6d7] bg-white py-0 shadow-sm">
            <CardContent className="p-0">
              <div className="relative flex flex-col xl:flex-row">
                <MeetingCardImage
                  imageUrl={meeting.heroImage}
                  title={meeting.title}
                  sizes="(min-width: 1280px) 300px, (min-width: 1024px) 36vw, 100vw"
                  showBookmark={false}
                  className="relative min-h-64 w-full overflow-hidden bg-[#f2f4f6] xl:min-h-full xl:w-[37%] xl:min-w-[220px] xl:self-stretch"
                />
                <div className="flex min-w-0 flex-1 flex-col justify-between gap-6 p-6 xl:pr-14">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <CategoryBadge category={meeting.category} className="h-auto px-3 py-1 text-xs" />
                      <BookMarkBtn
                        bookmarked={meeting.isBookmarked}
                        className="size-9 bg-white/80 p-2 shadow-sm backdrop-blur-md hover:bg-white"
                      />
                    </div>
                    <h1 className="max-w-xl text-[32px] font-medium leading-10 tracking-normal text-[#191c1e]">
                      {meeting.title}
                    </h1>
                    <p className="text-base leading-6 text-[#434655]">
                      모집 마감일 : {meeting.deadline}
                    </p>
                    {meeting.techStacks.length > 0 ? (
                      <TechStackBadges techStacks={meeting.techStacks} className="gap-1.5 pt-1" />
                    ) : null}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-[#c3c6d7] bg-white shadow-sm">
            <CardContent className="space-y-6 p-6">
              <SectionTitle icon={<BookOpenText className="size-5" />} title="모임소개" />
              <div className="space-y-4 text-base leading-7 text-[#434655]">
                {meeting.description.split("\n").map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-[#c3c6d7] bg-white shadow-sm">
            <CardContent className="space-y-6 p-6">
              <SectionTitle icon={<ClipboardList className="size-5" />} title="상세 모집 요건" />
              <div className="space-y-4">
                {meeting.positions.map((position) => (
                  <PositionRequirement key={position.id} position={position} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="flex flex-col gap-6 lg:col-span-4">
          <div className="sticky top-6 flex flex-col gap-6">
            <Card className="rounded-xl border-[#c3c6d7] bg-white shadow-sm">
              <CardContent className="space-y-5 p-6">
                <h2 className="text-xl font-medium tracking-normal text-[#191c1e]">진행 정보</h2>
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

                <div className="space-y-3 pt-2">
                  <h3 className="text-xl font-medium tracking-normal text-[#191c1e]">모집 현황</h3>
                  <div className="space-y-2">
                    {meeting.positions.map((position) => (
                      <RecruitmentStatus key={position.id} position={position} />
                    ))}
                  </div>
                  <div className="rounded-lg bg-[#f7f9fb] p-4">
                    <div className="mb-3 flex items-center justify-between text-sm">
                      <span className="text-[#434655]">전체 참여</span>
                      <span className="font-medium text-blue-500">
                        {meeting.memberCount} / {meeting.maxMembers}
                      </span>
                    </div>
                    <Progress value={getProgressValue(meeting.memberCount, meeting.maxMembers)} />
                  </div>
                </div>

                {isCurrentUserLeader ? (
                  <Button
                    asChild
                    className="h-14 w-full rounded-lg bg-blue-400 text-lg font-medium text-white hover:bg-blue-500"
                  >
                    <Link href={`/meetings/${meetingId}/edit`}>수정하기</Link>
                  </Button>
                ) : (
                  <Button
                    className="h-14 w-full rounded-lg bg-blue-400 text-lg font-medium text-white hover:bg-blue-500"
                    onClick={handleJoinClick}
                    disabled={isCheckingLeader || openPositions.length === 0 || !canJoinByStatus}
                  >
                    {isCheckingLeader
                      ? "권한 확인 중..."
                      : !canJoinByStatus
                        ? "모집 마감"
                        : openPositions.length === 0
                          ? "모집 완료"
                          : "참여하기"}
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-xl border-[#c3c6d7] bg-white shadow-sm">
              <CardContent className="space-y-4 p-6">
                <SectionTitle icon={<Users className="size-5" />} title="참여 멤버" />
                <div className="space-y-2">
                  {meeting.members.slice(0, 4).map((member) => (
                    <MemberRow key={member.id} member={member} />
                  ))}
                  {membersQuery.isError ? (
                    <p className="px-2 text-sm text-[#737686]">참여 멤버를 불러오지 못했습니다.</p>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </div>
        </aside>
      </div>

      <section className="pt-8">
        <MeetingRecommendationCarousel />
      </section>

      <JoinMeetingDialog
        open={joinDialogOpen}
        positions={openPositions}
        selectedPositionId={selectedPositionId}
        errorMessage={joinErrorMessage}
        isPending={joinMutation.isPending}
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
  const positions = meeting.positions ?? []
  const maxMembers =
    meeting.recruitSummary?.totalCount ??
    positions.reduce((total, position) => total + position.recruitCount, 0)
  const memberCount =
    meeting.recruitSummary?.currentCount ??
    positions.reduce((total, position) => total + position.currentCount, 0)

  return {
    title: meeting.title ?? "제목 없는 모임",
    category: CATEGORY_LABEL[meeting.category] ?? meeting.category ?? "프로젝트",
    deadline: formatDisplayDate(meeting.deadline),
    startDate: formatDisplayDate(meeting.startDate),
    duration: meeting.expectedDuration ?? meeting.duration ?? "-",
    meetingSchedule: meeting.meetingSchedule ?? meeting.meetingType ?? "-",
    memberCount,
    maxMembers,
    heroImage: meeting.thumbnailUrl ?? FALLBACK_MEETING_IMAGE_URL,
    description,
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

function getProgressValue(current: number, max: number) {
  if (max <= 0) {
    return 0
  }

  return (current / max) * 100
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

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-20 text-[#565e74]">
      <LoaderCircle
        className="size-5 animate-spin text-[#004ac6]"
        aria-hidden="true"
      />
      <span className="text-base font-medium">모임 상세 정보를 불러오는 중...</span>
    </div>
  )
}
