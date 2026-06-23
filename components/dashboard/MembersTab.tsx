"use client"

import { useState } from "react"

import { MemberProfileDialog } from "@/components/common/MemberProfileDialog"
import { ProfileAvatar } from "@/components/common/ProfileAvatar"
import { HostBadge } from "@/components/ui/badge"
import { useMeetingMembers } from "@/hooks/dashboard/use-members"

import { EmptyState, ListSkeleton } from "./DashboardStates"

type MembersTabProps = {
  meetingId: number
}

export function MembersTab({ meetingId }: MembersTabProps) {
  const { data: members, isError } = useMeetingMembers(meetingId)
  const [profileUserId, setProfileUserId] = useState<number | null>(null)

  if (isError)
    return <p className="text-sm text-destructive">멤버 목록을 불러오지 못했습니다.</p>
  if (!members) return <ListSkeleton rows={4} />

  const leader = members.find((m) => m.isLeader)
  const others = members.filter((m) => !m.isLeader)

  return (
    <div className="flex flex-col gap-4">
      {leader && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-3 text-base font-semibold">모임장</h2>
          <MemberItem
            name={leader.nickname}
            role={leader.positionName ?? leader.job ?? "역할 미정"}
            profileImage={leader.profileImage}
            isLeader
            onClick={() => setProfileUserId(leader.id)}
          />
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-3 text-base font-semibold">
          참여 멤버{" "}
          <span className="text-sm font-normal text-muted-foreground">{others.length}</span>
        </h2>
        {others.length === 0 ? (
          <EmptyState message="참여 멤버가 없습니다." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {others.map((member) => (
              <MemberItem
                key={member.id}
                name={member.nickname}
                role={member.positionName ?? member.job ?? "역할 미정"}
                profileImage={member.profileImage}
                onClick={() => setProfileUserId(member.id)}
              />
            ))}
          </div>
        )}
      </div>

      <MemberProfileDialog
        userId={profileUserId}
        onClose={() => setProfileUserId(null)}
      />
    </div>
  )
}

function MemberItem({
  name,
  role,
  profileImage,
  isLeader,
  onClick,
}: {
  name: string
  role: string
  profileImage?: string | null
  isLeader?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl border border-border bg-muted/30 p-4 text-left transition-colors hover:bg-muted/50"
    >
      <ProfileAvatar profileImage={profileImage} nickname={name} className="size-10" />
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold">{name}</p>
          {isLeader && <HostBadge />}
        </div>
        <p className="text-xs text-muted-foreground">{role}</p>
      </div>
    </button>
  )
}
