import { useRef } from "react"

import { ChevronDown, X } from "lucide-react"

import { ProfileAvatar } from "@/components/common/ProfileAvatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  ONBOARDING_CAREER_OPTIONS,
  ONBOARDING_JOB_OPTIONS,
} from "@/constants/onboarding"
import {
  INTRO_MAX,
  NICKNAME_MAX,
  type ProfileEditState,
} from "@/hooks/mypage/use-profile-edit"
import type { Profile } from "@/lib/api/mypage"
import { cn } from "@/lib/utils"

// select를 공통 Input과 동일한 외형으로 맞추는 클래스.
// 네이티브 화살표는 숨기고(appearance-none) 오른쪽에 커스텀 ChevronDown을 얹는다(pr-10).
const selectClass =
  "h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-white pl-4 pr-10 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-100 disabled:cursor-not-allowed disabled:opacity-50"

type ProfileEditDialogProps = {
  profile: Profile
  edit: ProfileEditState
  open: boolean
  onCancel: () => void
  onSave: () => void
}

export function ProfileEditDialog({
  profile,
  edit,
  open,
  onCancel,
  onSave,
}: ProfileEditDialogProps) {
  // 숨겨진 파일 input은 이 다이얼로그의 UI 관심사라 여기서 ref를 소유한다.
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    // 닫기(ESC/바깥클릭)는 취소와 동일하게 입력값을 되돌린다.
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel()
      }}
    >
      <DialogContent className="max-h-[85vh] max-w-2xl gap-6 overflow-y-auto">
        <DialogHeader>
          <DialogTitle>프로필 수정</DialogTitle>
          <DialogDescription>
            프로필 이미지와 정보를 수정한 뒤 저장하세요.
          </DialogDescription>
        </DialogHeader>

        <div className="mb-2 flex items-center gap-4">
          <div className="relative">
            <ProfileAvatar
              profileImage={edit.previewImage}
              // 이미지 없을 때 fallback 이니셜이 편집 중 닉네임을 따라가도록(비면 기존 닉네임).
              nickname={edit.nickname || profile.nickname}
              className="size-24"
              fallbackClassName="text-3xl"
            />
            {edit.canRemoveImage && (
              <button
                type="button"
                onClick={edit.removeCurrentImage}
                disabled={edit.submitting}
                aria-label="이미지 제거"
                className="absolute top-0.5 right-0.5 flex size-6 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm transition-colors outline-none hover:bg-destructive hover:text-white focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={edit.onSelectImage}
              className="hidden"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={edit.submitting}
              >
                이미지 변경
              </Button>
            </div>
            <span className="text-xs text-muted-foreground">
              {edit.removeImage
                ? "저장 시 기본 이미지로 변경돼요"
                : edit.imageFile
                  ? "저장 시 적용돼요 · jpg/png/webp · 5MB 이하"
                  : "jpg/png/webp · 5MB 이하"}
            </span>
          </div>
        </div>

        <div className="grid gap-4 text-sm">
          <div className="mb-1 grid gap-1">
            <span className="text-xs text-muted-foreground">이메일</span>
            <p className="flex h-12 items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-500">
              {profile.email}
            </p>
          </div>
          <label className="grid gap-1">
            <span className="text-xs text-muted-foreground">
              닉네임 (1-10자)
            </span>
            <Input
              value={edit.nickname}
              onChange={(e) => edit.setNickname(e.target.value)}
              aria-invalid={edit.nicknameEmpty || edit.nicknameOver}
              className={cn(
                (edit.nicknameEmpty || edit.nicknameOver) &&
                  "border-red-400 focus:border-red-500 focus:ring-red-100"
              )}
            />
            <div className="flex items-center justify-between pr-2 text-xs">
              <span role="alert" className="text-red-500">
                {edit.nicknameEmpty
                  ? "닉네임을 입력해주세요."
                  : edit.nicknameOver
                    ? `닉네임은 ${NICKNAME_MAX}자 이하여야 해요.`
                    : ""}
              </span>
              <span
                className={cn(
                  "text-right text-muted-foreground tabular-nums",
                  (edit.nicknameEmpty || edit.nicknameOver) && "text-red-500"
                )}
              >
                {edit.nickname.length}/{NICKNAME_MAX}
              </span>
            </div>
          </label>
          <label className="grid gap-1">
            <span className="text-xs text-muted-foreground">
              소개 한줄 (최대 50자)
            </span>
            <Input
              value={edit.introduction}
              onChange={(e) => edit.setIntroduction(e.target.value)}
              aria-invalid={edit.introOver}
              className={cn(
                edit.introOver &&
                  "border-red-400 focus:border-red-500 focus:ring-red-100"
              )}
            />
            <div className="flex items-center justify-between pr-2 text-xs">
              <span role="alert" className="text-red-500">
                {edit.introOver ? `소개는 ${INTRO_MAX}자 이하여야 해요.` : ""}
              </span>
              <span
                className={cn(
                  "text-right text-muted-foreground tabular-nums",
                  edit.introOver && "text-red-500"
                )}
              >
                {edit.introduction.length}/{INTRO_MAX}
              </span>
            </div>
          </label>
          <label className="grid gap-1">
            <span className="text-xs text-muted-foreground">직군</span>
            <div className="relative">
              <select
                value={edit.job}
                onChange={(e) => edit.setJob(e.target.value)}
                className={selectClass}
              >
                <option value="">직군을 선택해주세요</option>
                {ONBOARDING_JOB_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-slate-400" />
            </div>
          </label>
          <label className="grid gap-1">
            <span className="text-xs text-muted-foreground">경력</span>
            <div className="relative">
              <select
                value={edit.career}
                onChange={(e) => edit.setCareer(e.target.value)}
                className={selectClass}
              >
                <option value="">경력을 선택해주세요</option>
                {ONBOARDING_CAREER_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-slate-400" />
            </div>
          </label>
          <div className="grid gap-2">
            <span className="text-xs text-muted-foreground">
              기술 스택 (1개 이상)
            </span>
            <Input
              value={edit.skillQuery}
              onChange={(e) => edit.setSkillQuery(e.target.value)}
              placeholder="기술 스택 검색"
            />
            {edit.filteredSkills.length > 0 ? (
              <div className="grid max-h-56 grid-cols-3 gap-2 overflow-y-auto pr-1">
                {edit.filteredSkills.map((skill) => {
                  const selected = edit.techStacks.includes(skill)
                  return (
                    <button
                      key={skill}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => edit.toggleSkill(skill)}
                      className={cn(
                        "min-h-8 rounded-md border px-2 py-1 text-xs font-medium transition-colors",
                        selected
                          ? "border-foreground bg-foreground text-background"
                          : "bg-background hover:bg-muted"
                      )}
                    >
                      {skill}
                    </button>
                  )
                })}
              </div>
            ) : (
              <p className="py-4 text-center text-xs text-muted-foreground">
                &lsquo;{edit.skillQuery}&rsquo;에 대한 검색 결과가 없어요.
              </p>
            )}
            <div className="flex items-center justify-between text-xs">
              <span role="alert" className="text-red-500">
                {edit.techStacksEmpty
                  ? "기술 스택을 1개 이상 선택해주세요."
                  : ""}
              </span>
              <span
                className={cn(
                  "text-muted-foreground tabular-nums",
                  edit.techStacksEmpty && "text-red-500"
                )}
              >
                {edit.techStacks.length}개 선택됨
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel} disabled={edit.submitting}>
            취소
          </Button>
          <Button onClick={onSave} disabled={edit.submitting || !edit.canSave}>
            {edit.submitting ? "저장 중..." : "저장"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
