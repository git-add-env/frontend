"use client"

import { useEffect, useState } from "react"

import { MemberProfileDialog } from "@/components/common/MemberProfileDialog"
import { ProfileAvatar } from "@/components/common/ProfileAvatar"
import { fetchMeetingMembers, type MeetingMember } from "@/lib/api/meetings"

type MembersTabProps = {
  meetingId: number
}

export function MembersTab({ meetingId }: MembersTabProps) {
  const [members, setMembers] = useState<MeetingMember[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [profileUserId, setProfileUserId] = useState<number | null>(null)

  useEffect(() => {
    fetchMeetingMembers(meetingId)
      .then((res) => setMembers(res.members))
      .catch(() => setError("멤버 목록을 불러오지 못했습니다."))
  }, [meetingId])

  if (error) return <p className="text-sm text-destructive">{error}</p>
  if (!members) return <p className="text-sm text-muted-foreground">불러오는 중...</p>

  const leader = members.find((m) => m.isLeader)
  const others = members.filter((m) => !m.isLeader)

  return (
    <div className="flex flex-col gap-4">
      {leader && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <p className="mb-3 text-sm text-muted-foreground">모임장</p>
          <MemberItem
            name={leader.nickname}
            role={leader.job ?? "직군 미설정"}
            profileImage={leader.profileImage}
            isLeader
            onClick={() => setProfileUserId(leader.id)}
          />
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-6">
        <p className="mb-3 text-sm text-muted-foreground">
          참여 멤버 ({others.length})
        </p>
        {others.length === 0 ? (
          <p className="text-sm text-muted-foreground">참여 멤버가 없습니다.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {others.map((member) => (
              <MemberItem
                key={member.id}
                name={member.nickname}
                role={member.job ?? "직군 미설정"}
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
      className="flex w-full items-center gap-3 rounded-xl border border-border p-3 text-left transition-colors hover:bg-accent"
    >
      <ProfileAvatar profileImage={profileImage} nickname={name} className="size-10" />
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{name}</p>
          {isLeader && (
            <span className="rounded-full bg-foreground px-2 py-0.5 text-xs text-background">
              모임장
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{role}</p>
      </div>
    </button>
  )
}
