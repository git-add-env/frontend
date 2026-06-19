"use client"

import { useState } from "react"

import { useProfileEdit } from "@/hooks/mypage/use-profile-edit"
import type { Profile } from "@/lib/api/mypage"

import { ProfileEditDialog } from "./ProfileEditDialog"
import { ProfileView } from "./ProfileView"

type ProfileCardProps = {
  profile: Profile
}

// 보기(ProfileView) + 수정 모달(ProfileEditDialog)을 묶고 편집 상태만 관리한다.
// 폼 상태/검증/저장 로직은 useProfileEdit 훅에 위임.
export function ProfileCard({ profile }: ProfileCardProps) {
  const edit = useProfileEdit(profile)
  const [editing, setEditing] = useState(false)

  function handleCancel() {
    edit.reset()
    setEditing(false)
  }

  async function handleSave() {
    if (await edit.save()) setEditing(false)
  }

  return (
    <>
      <ProfileView profile={profile} onEdit={() => setEditing(true)} />
      <ProfileEditDialog
        profile={profile}
        edit={edit}
        open={editing}
        onCancel={handleCancel}
        onSave={handleSave}
      />
    </>
  )
}
