"use client"

import { XIcon } from "lucide-react"

import { ProfileAvatar } from "@/components/common/ProfileAvatar"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useMemberProfile } from "@/hooks/dashboard/use-members"

// DB-011 / DB-API-016: 멤버 프로필 조회 전용 모달.
// userId를 주면 해당 유저 프로필을 모달로 띄운다. (어느 페이지에서든 재사용 가능)
export function MemberProfileDialog({
  userId,
  onClose,
}: {
  userId: number | null
  onClose: () => void
}) {
  return (
    <Dialog open={userId !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="py-12 sm:max-w-md" showCloseButton={false}>
        {/* 제목은 화면에선 숨기고 스크린리더 접근성용으로만 유지 (Dialog는 title 필수) */}
        <DialogHeader className="sr-only">
          <DialogTitle>멤버 프로필</DialogTitle>
        </DialogHeader>
        {/* 기본 X 대신 동그란 테두리 + 살짝 안쪽 배치 커스텀 닫기 버튼 */}
        <DialogClose className="absolute top-6 right-6 rounded-full border bg-muted p-1.5 opacity-70 transition-opacity hover:bg-accent hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
          <XIcon className="size-4" />
          <span className="sr-only">닫기</span>
        </DialogClose>
        {userId !== null && <MemberProfileBody key={userId} userId={userId} />}
      </DialogContent>
    </Dialog>
  )
}

function MemberProfileBody({ userId }: { userId: number }) {
  const { data: profile, isLoading } = useMemberProfile(userId)

  return (
    <>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      ) : profile ? (
      <div className="flex flex-col items-center gap-3 text-center">
        {/* 1. 프로필 이미지 (없거나 로드 실패 시 이니셜 폴백) */}
        <ProfileAvatar
          profileImage={profile.profileImage}
          nickname={profile.nickname}
          className="size-24"
          fallbackClassName="text-2xl"
        />
        <p className="mt-2 text-base font-semibold">{profile.nickname}</p>

        {/* 2. 소개글 */}
        <p className="w-full wrap-break-word text-sm text-muted-foreground">
          {profile.introduction ?? "소개가 없습니다."}
        </p>

        {/* 3. 직군 · 경력 (같은 라인) */}
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">{profile.job ?? "직군 미설정"}</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">{profile.career ?? "경력 미설정"}</span>
        </div>

        {/* 4. 기술 스택 */}
        {profile.techStacks.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1">
            {profile.techStacks.map((stack) => (
              <span
                key={stack}
                className="rounded-full bg-muted px-2 py-0.5 text-xs"
              >
                {stack}
              </span>
            ))}
          </div>
        )}
      </div>
      ) : (
      <p className="text-sm text-muted-foreground">프로필을 불러오지 못했습니다.</p>
      )}
    </>
  )
}
