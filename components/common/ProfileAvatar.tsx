import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type ProfileAvatarProps = {
  // 프로필 이미지 URL. 없거나 로드 실패 시 닉네임 이니셜로 폴백(radix Avatar 자동 처리).
  profileImage?: string | null
  nickname?: string | null
  // Avatar 크기 등 (예: "size-24")
  className?: string
  // 이니셜 폴백 텍스트 크기 등 (예: "text-2xl")
  fallbackClassName?: string
}

export function ProfileAvatar({
  profileImage,
  nickname,
  className,
  fallbackClassName,
}: ProfileAvatarProps) {
  const initial = nickname?.trim().charAt(0).toUpperCase() || "?"
  return (
    <Avatar className={className}>
      {/* src를 조건부로 빼면 radix가 loadingStatus를 'loaded'로 남겨 폴백이 안 뜬다.
         항상 렌더하고 src만 토글 → 이미지 없으면 자동으로 이니셜 폴백 표시. */}
      <AvatarImage src={profileImage ?? undefined} alt={nickname ?? ""} />
      <AvatarFallback className={fallbackClassName}>{initial}</AvatarFallback>
    </Avatar>
  )
}
