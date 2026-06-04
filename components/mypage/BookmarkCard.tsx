import { BookMarkBtn } from "@/components/common/BookMarkBtn"
import { Badge, CategoryBadge } from "@/components/ui/badge"
import { CATEGORY_LABEL } from "@/constants/category"
import type { Bookmark } from "@/lib/api/mypage"
import { formatDeadline } from "@/lib/date"

type BookmarkCardProps = {
  bookmark: Bookmark
  onRemove: () => void
}

export function BookmarkCard({ bookmark, onRemove }: BookmarkCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-2 flex items-center gap-2">
        <CategoryBadge category={CATEGORY_LABEL[bookmark.category] ?? bookmark.category} />
        <Badge variant="dday" className="ml-auto">
          {formatDeadline(bookmark.deadline)}
        </Badge>
      </div>
      <h3 className="text-sm font-semibold">{bookmark.title}</h3>
      <div className="mt-3 flex justify-end">
        {/* 이미 찜한 목록이라 채워진(filled) 상태로 표시, 클릭 시 찜 해제 */}
        <BookMarkBtn bookmarked onToggle={onRemove} className="size-10" />
      </div>
    </div>
  )
}
