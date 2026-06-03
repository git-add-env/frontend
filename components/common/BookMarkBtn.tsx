"use client"

import { useState } from "react"
import { Bookmark } from "lucide-react"

export function BookMarkBtn() {
    // 찜 여부 상태 (클릭 시 토글)
    const [bookmarked, setBookmarked] = useState(false)

    return (
        <button
            type="button"
            onClick={() => setBookmarked((prev) => !prev)}
            aria-pressed={bookmarked}
            className="flex size-12 items-center justify-center rounded-full border bg-white p-2 transition-transform duration-200 hover:scale-110 hover:shadow-md active:scale-95"
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
