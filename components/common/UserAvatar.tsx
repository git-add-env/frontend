"use client"

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
import { useAuthStore } from "@/stores/auth-store"

// 닉네임 첫 글자를 대문자 이니셜로 (빈 값이면 "?")
function initialOf(nickname: string | null | undefined) {
    const first = nickname?.trim().charAt(0)
    return first ? first.toUpperCase() : "?"
}

// 현재 로그인 유저의 프로필 아바타 (이미지 없거나 로드 실패 시 이니셜 폴백)
export function UserAvatar() {
    const user = useAuthStore((s) => s.user)
    const initial = initialOf(user?.nickname)

    return (
        <Avatar>
            {/* src 조건부 제거 시 radix가 폴백을 안 띄우므로 항상 렌더하고 src만 토글 */}
            <AvatarImage
                src={user?.profileImage ?? undefined}
                alt={user?.nickname ?? ""}
                className="grayscale"
            />
            <AvatarFallback>{initial}</AvatarFallback>
        </Avatar>
    )
}
