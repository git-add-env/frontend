"use client"

import { useMemo, useRef, useState } from "react"

import { ProfileAvatar } from "@/components/common/ProfileAvatar"
import { TechStackBadges } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ONBOARDING_CAREER_OPTIONS,
  ONBOARDING_JOB_OPTIONS,
  ONBOARDING_TECH_STACK_OPTIONS,
} from "@/constants/onboarding"
import { useUpdateProfile } from "@/hooks/mypage/use-profile"
import { uploadProfileImage, type Profile } from "@/lib/api/mypage"
import { cn } from "@/lib/utils"

type ProfileCardProps = {
  profile: Profile
}

export function ProfileCard({ profile }: ProfileCardProps) {
  const updateProfile = useUpdateProfile()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [editing, setEditing] = useState(false)
  const [nickname, setNickname] = useState(profile.nickname)
  const [introduction, setIntroduction] = useState(profile.introduction ?? "")
  const [job, setJob] = useState(profile.job ?? "")
  const [career, setCareer] = useState(profile.career ?? "")
  const [techStacks, setTechStacks] = useState<string[]>(profile.techStacks)
  const [skillQuery, setSkillQuery] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filteredSkills = useMemo(() => {
    const query = skillQuery.trim().toLowerCase()
    return query
      ? ONBOARDING_TECH_STACK_OPTIONS.filter((skill) => skill.toLowerCase().includes(query))
      : ONBOARDING_TECH_STACK_OPTIONS
  }, [skillQuery])

  function toggleSkill(skill: string) {
    setTechStacks((current) =>
      current.includes(skill) ? current.filter((item) => item !== skill) : [...current, skill],
    )
  }

  function cancel() {
    setNickname(profile.nickname)
    setIntroduction(profile.introduction ?? "")
    setJob(profile.job ?? "")
    setCareer(profile.career ?? "")
    setTechStacks(profile.techStacks)
    setSkillQuery("")
    setError(null)
    setEditing(false)
  }

  async function save() {
    setSubmitting(true)
    setError(null)
    try {
      await updateProfile.mutateAsync({
        nickname,
        introduction,
        job: job || undefined,
        career: career || undefined,
        techStacks,
      })
      setEditing(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : "수정에 실패했습니다.")
    } finally {
      setSubmitting(false)
    }
  }

  // MP-003: 파일 유효성 검증 → presign → S3 PUT → profileImage 저장.
  async function onSelectImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setError("이미지는 5MB 이하여야 합니다.")
      return
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("jpg/png/webp 형식만 업로드할 수 있습니다.")
      return
    }

    setUploading(true)
    setError(null)
    try {
      const imageUrl = await uploadProfileImage(file)
      await updateProfile.mutateAsync({ profileImage: imageUrl })
    } catch (e) {
      setError(e instanceof Error ? e.message : "이미지 업로드에 실패했습니다.")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">프로필</h2>
        {editing ? (
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={cancel} disabled={submitting}>
              취소
            </Button>
            <Button size="sm" onClick={save} disabled={submitting}>
              {submitting ? "저장 중..." : "저장"}
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
            수정
          </Button>
        )}
      </div>

      {error && (
        <p className="mb-3 rounded-md border border-destructive/40 bg-destructive/5 p-2 text-xs text-destructive">
          {error}
        </p>
      )}

      <div className="mb-4 flex items-center gap-4">
        <ProfileAvatar
          profileImage={profile.profileImage}
          nickname={profile.nickname}
          className="size-24"
          fallbackClassName="text-3xl"
        />
        {editing && (
          <div className="flex flex-col gap-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={onSelectImage}
              className="hidden"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? "업로드 중..." : "이미지 변경"}
            </Button>
            <span className="text-xs text-muted-foreground">jpg/png/webp · 5MB 이하</span>
          </div>
        )}
      </div>

      <dl className="grid gap-3 text-sm">
        <Field label="이메일" value={profile.email} />
        {editing ? (
          <label className="grid gap-1">
            <span className="text-xs text-muted-foreground">닉네임 (1-10자)</span>
            <input
              value={nickname}
              maxLength={10}
              onChange={(e) => setNickname(e.target.value)}
              className="h-9 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
        ) : (
          <Field label="닉네임" value={profile.nickname} />
        )}
        {editing ? (
          <label className="grid gap-1">
            <span className="text-xs text-muted-foreground">소개 한줄 (최대 50자)</span>
            <input
              value={introduction}
              maxLength={50}
              onChange={(e) => setIntroduction(e.target.value)}
              className="h-9 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
        ) : (
          <Field label="소개" value={profile.introduction ?? "—"} />
        )}
        {editing ? (
          <label className="grid gap-1">
            <span className="text-xs text-muted-foreground">직군</span>
            <select
              value={job}
              onChange={(e) => setJob(e.target.value)}
              className="h-9 rounded-md border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">직군을 선택해주세요</option>
              {ONBOARDING_JOB_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <Field label="직군" value={profile.job ?? "—"} />
        )}
        {editing ? (
          <label className="grid gap-1">
            <span className="text-xs text-muted-foreground">경력</span>
            <select
              value={career}
              onChange={(e) => setCareer(e.target.value)}
              className="h-9 rounded-md border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">경력을 선택해주세요</option>
              {ONBOARDING_CAREER_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <Field label="경력" value={profile.career ?? "—"} />
        )}
        {editing ? (
          <div className="grid gap-2">
            <span className="text-xs text-muted-foreground">기술 스택</span>
            <input
              value={skillQuery}
              onChange={(e) => setSkillQuery(e.target.value)}
              placeholder="기술 스택 검색"
              className="h-9 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <div className="grid max-h-40 grid-cols-3 gap-2 overflow-y-auto pr-1">
              {filteredSkills.map((skill) => {
                const selected = techStacks.includes(skill)
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={cn(
                      "min-h-8 rounded-md border px-2 py-1 text-xs font-medium transition-colors",
                      selected
                        ? "border-foreground bg-foreground text-background"
                        : "bg-background hover:bg-muted",
                    )}
                  >
                    {skill}
                  </button>
                )
              })}
            </div>
            <span className="text-xs text-muted-foreground">{techStacks.length}개 선택됨</span>
          </div>
        ) : (
          <div className="grid grid-cols-[6rem_1fr] items-baseline gap-3">
            <dt className="text-sm text-muted-foreground">기술 스택</dt>
            <dd>
              {profile.techStacks.length > 0 ? (
                <TechStackBadges techStacks={profile.techStacks} />
              ) : (
                <span className="text-base">—</span>
              )}
            </dd>
          </div>
        )}
      </dl>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[6rem_1fr] items-baseline gap-3">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-base">{value}</dd>
    </div>
  )
}
