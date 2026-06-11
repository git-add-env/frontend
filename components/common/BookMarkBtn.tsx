"use client"

import { useState } from "react"
import { Bookmark } from "lucide-react"

import { cn } from "@/lib/utils"

type BookMarkBtnProps = {

  // 제어형: 값을 주면 그 상태를 그대로 반영. 안 주면 내부 state로 토글(비제어형).
  bookmarked?: boolean
  onToggle?: (next: boolean) => void
  className?: string
}

export function BookMarkBtn({ bookmarked: controlled, onToggle, className }: BookMarkBtnProps = {}) {
  // 찜 여부 상태 (비제어형일 때만 사용, 클릭 시 토글)
  const [internal, setInternal] = useState(false)
  const isControlled = controlled !== undefined
  const bookmarked = isControlled ? controlled : internal

  function handleClick() {
    const next = !bookmarked
    if (!isControlled) setInternal(next)
    onToggle?.(next)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={bookmarked ? "북마크 해제" : "북마크 추가"}
      aria-pressed={bookmarked}
      className={cn(
        "flex size-12 items-center justify-center rounded-full border bg-white p-2 transition-transform duration-200 hover:scale-110 hover:shadow-md active:scale-95",
        className,
      )}
    >
      <Bookmark
        className={
          bookmarked
            ? "text-blue-400 fill-blue-400 transition-colors"
            : "text-blue-400 transition-colors"
        }
      />
    </button>
  )
}
