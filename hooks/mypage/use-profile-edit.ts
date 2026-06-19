"use client"

import { useEffect, useMemo, useState } from "react"

import { ONBOARDING_TECH_STACK_OPTIONS } from "@/constants/onboarding"
import { useUpdateProfile } from "@/hooks/mypage/use-profile"
import { uploadProfileImage, type Profile } from "@/lib/api/mypage"
import { notify } from "@/lib/notify"

export const NICKNAME_MAX = 10
export const INTRO_MAX = 50

// ProfileCard 수정 폼의 상태·검증·이미지 draft·저장 로직을 한곳에 모은 훅.
// 이미지는 즉시 업로드하지 않고 파일을 들고 있다가 save() 때 업로드한다(draft).
export function useProfileEdit(profile: Profile) {
  const updateProfile = useUpdateProfile()
  const [nickname, setNickname] = useState(profile.nickname)
  const [introduction, setIntroduction] = useState(profile.introduction ?? "")
  const [job, setJob] = useState(profile.job ?? "")
  const [career, setCareer] = useState(profile.career ?? "")
  const [techStacks, setTechStacks] = useState<string[]>(profile.techStacks)
  const [skillQuery, setSkillQuery] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  // 기존 이미지를 지우려는 의도. save() 시 profileImage: "" 로 전송.
  const [removeImage, setRemoveImage] = useState(false)

  // 미리보기 objectURL은 메모리 누수 방지를 위해 언마운트 시 해제.
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview)
    }
  }, [imagePreview])

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

  const nicknameEmpty = nickname.trim().length === 0
  const nicknameOver = nickname.length > NICKNAME_MAX
  const introOver = introduction.length > INTRO_MAX
  const techStacksEmpty = techStacks.length === 0
  const isValid = !nicknameEmpty && !nicknameOver && !introOver && !techStacksEmpty

  // 변경 감지: 하나라도 기존 값과 다를 때만 저장 활성 → 의미 없는 PATCH 방지.
  const techStacksChanged =
    techStacks.length !== profile.techStacks.length ||
    techStacks.some((skill) => !profile.techStacks.includes(skill))
  const isDirty =
    nickname.trim() !== profile.nickname ||
    introduction.trim() !== (profile.introduction ?? "") ||
    job !== (profile.job ?? "") ||
    career !== (profile.career ?? "") ||
    techStacksChanged ||
    imageFile !== null ||
    removeImage

  const canSave = isValid && isDirty

  // 선택해둔 미리보기 이미지/제거 의도를 비우고 objectURL을 해제.
  function clearPendingImage() {
    setImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    setImageFile(null)
    setRemoveImage(false)
  }

  // 입력값을 현재 프로필 기준으로 되돌린다(취소/닫기 시).
  function reset() {
    setNickname(profile.nickname)
    setIntroduction(profile.introduction ?? "")
    setJob(profile.job ?? "")
    setCareer(profile.career ?? "")
    setTechStacks(profile.techStacks)
    setSkillQuery("")
    clearPendingImage()
  }

  // 파일 유효성만 검증하고 미리보기로 보관 — 실제 업로드는 save()에서.
  function onSelectImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      notify.error("이미지는 5MB 이하여야 합니다.")
      return
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      notify.error("jpg/png/webp 형식만 업로드할 수 있습니다.")
      return
    }

    setRemoveImage(false)
    setImageFile(file)
    setImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return URL.createObjectURL(file)
    })
  }

  function removeCurrentImage() {
    clearPendingImage()
    setRemoveImage(true)
  }

  // 저장 성공 시 true 반환(호출부에서 모달 닫기에 사용).
  async function save(): Promise<boolean> {
    if (!canSave) return false
    setSubmitting(true)
    try {
      // 새 이미지가 있으면 업로드(presign→S3)한 URL을, 제거 의도면 빈 문자열을 함께 PATCH.
      let nextImage: string | null | undefined
      if (imageFile) nextImage = await uploadProfileImage(imageFile)
      else if (removeImage) nextImage = "" // 백엔드가 null은 무시 → 빈 문자열로 "삭제" 시도
      await updateProfile.mutateAsync({
        nickname: nickname.trim(),
        introduction: introduction.trim(),
        job: job || undefined,
        career: career || undefined,
        techStacks,
        ...(nextImage !== undefined ? { profileImage: nextImage } : {}),
      })
      notify.success("프로필을 저장했어요.")
      clearPendingImage()
      return true
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "수정에 실패했습니다.")
      return false
    } finally {
      setSubmitting(false)
    }
  }

  // 미리보기에 보여줄 아바타 이미지: 제거 의도면 null, 아니면 새 미리보기 → 기존 순.
  const previewImage = removeImage ? null : (imagePreview ?? profile.profileImage)
  // "이미지 제거" 버튼 노출 조건.
  const canRemoveImage = (Boolean(profile.profileImage) || Boolean(imageFile)) && !removeImage

  return {
    nickname,
    setNickname,
    introduction,
    setIntroduction,
    job,
    setJob,
    career,
    setCareer,
    techStacks,
    toggleSkill,
    skillQuery,
    setSkillQuery,
    filteredSkills,
    onSelectImage,
    removeCurrentImage,
    previewImage,
    canRemoveImage,
    imageFile,
    removeImage,
    nicknameEmpty,
    nicknameOver,
    introOver,
    techStacksEmpty,
    canSave,
    submitting,
    reset,
    save,
  }
}

export type ProfileEditState = ReturnType<typeof useProfileEdit>
