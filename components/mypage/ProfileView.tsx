import { Briefcase, Mail, Pencil } from "lucide-react"

import { ProfileAvatar } from "@/components/common/ProfileAvatar"
import { TechStackBadges } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Profile } from "@/lib/api/mypage"

type ProfileViewProps = {
  profile: Profile
  onEdit: () => void
}

// 보기 모드: 가로 배너형 — 아바타 + (이름·직군·경력) + 소개 + 이메일 + 기술스택, 우상단 수정 버튼.
export function ProfileView({ profile, onEdit }: ProfileViewProps) {
  return (
    <div className="rounded-2xl border border-border bg-[#1abcfe]/5 px-6 py-5">
      <div className="flex flex-col items-center gap-5 text-center md:flex-row md:items-center md:gap-7 md:text-left">
        <ProfileAvatar
          profileImage={profile.profileImage}
          nickname={profile.nickname}
          className="size-28"
          fallbackClassName="text-4xl"
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-muted-foreground md:justify-start">
            <span className="text-lg font-bold text-foreground">{profile.nickname}</span>
            {profile.job && (
              <>
                <span aria-hidden>·</span>
                <span>{profile.job}</span>
              </>
            )}
            {profile.career && (
              <>
                <span aria-hidden>·</span>
                <span className="inline-flex items-center gap-1">
                  <Briefcase className="size-3.5" />
                  {profile.career}
                </span>
              </>
            )}
          </div>

          {profile.introduction && (
            <p className="mt-1.5 text-sm text-foreground/80">{profile.introduction}</p>
          )}

          <div className="mt-1.5 flex items-center justify-center gap-1.5 text-sm text-muted-foreground md:justify-start">
            <Mail className="size-3.5 shrink-0" />
            <span className="truncate" title={profile.email}>
              {profile.email}
            </span>
          </div>

          {profile.techStacks.length > 0 && (
            <TechStackBadges
              techStacks={profile.techStacks}
              className="mt-3 justify-center md:justify-start"
            />
          )}
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={onEdit}
          className="w-full shrink-0 md:w-auto md:self-start"
        >
          <Pencil />
          프로필 수정
        </Button>
      </div>
    </div>
  )
}
