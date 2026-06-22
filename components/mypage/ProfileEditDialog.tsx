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
      {/* 헤더/푸터는 고정하고 본문만 스크롤 → 제목·닫기(X) 위로 본문이 올라타지 않게 */}
      <DialogContent className="flex max-h-[85vh] max-w-2xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>프로필 수정</DialogTitle>
          <DialogDescription>
            프로필 이미지와 정보를 수정한 뒤 저장하세요.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          <div className="flex items-center gap-4">
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
            <div className="grid gap-1">
              <span className="text-xs text-muted-foreground">이메일</span>
              <p className="flex h-12 items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-500">
                {profile.email}
              </p>
            </div>
            <label className="grid gap-1">
              <span className="text-xs text-muted-foreground">닉네임</span>
              <Input
                value={edit.nickname}
                // maxLength는 한글 IME에서 1자 초과되는 경우가 있어 onChange에서 잘라 보강.
                onChange={(e) =>
                  edit.setNickname(e.target.value.slice(0, NICKNAME_MAX))
                }
                maxLength={NICKNAME_MAX}
                disabled={edit.submitting}
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
              <span className="text-xs text-muted-foreground">소개 한줄</span>
              <Input
                value={edit.introduction}
                onChange={(e) =>
                  edit.setIntroduction(e.target.value.slice(0, INTRO_MAX))
                }
                maxLength={INTRO_MAX}
                disabled={edit.submitting}
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
                  disabled={edit.submitting}
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
                  disabled={edit.submitting}
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
                disabled={edit.submitting}
                placeholder="기술 스택 검색"
              />
              {/* 선택된 기술스택 — 검색/스크롤과 무관하게 항상 보이게 (X로 해제) */}
              {edit.techStacks.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {edit.techStacks.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => edit.toggleSkill(skill)}
                      disabled={edit.submitting}
                      className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {skill}
                      <X className="size-3" />
                    </button>
                  ))}
                </div>
              )}
              {/* 결과 수와 무관하게 고정 높이 → 검색 중 영역이 들썩이지 않게 */}
              <div className="h-56 overflow-y-auto pr-1">
                {edit.filteredSkills.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {edit.filteredSkills.map((skill) => {
                      const selected = edit.techStacks.includes(skill)
                      return (
                        <button
                          key={skill}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => edit.toggleSkill(skill)}
                          disabled={edit.submitting}
                          className={cn(
                            "min-h-8 rounded-md border px-2 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                            selected
                              ? "border-blue-500 bg-blue-500 text-white"
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
              </div>
              <div className="flex justify-end text-xs">
                {edit.techStacksEmpty ? (
                  <span role="alert" className="text-red-500">
                    기술 스택을 1개 이상 선택해주세요.
                  </span>
                ) : (
                  <span className="text-muted-foreground tabular-nums">
                    {edit.techStacks.length}개 선택됨
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t px-6 py-4">
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
