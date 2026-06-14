import { Badge, CategoryBadge, HostBadge } from "@/components/ui/badge"
import { CATEGORY_LABEL } from "@/constants/category"
import type { Meeting } from "@/lib/api/mypage"

type MeetingHeaderProps = {
  group: Meeting | null
}

// 선택한 모임의 제목 + 카테고리/상태/모임장 배지.
export function MeetingHeader({ group }: MeetingHeaderProps) {
  return (
    <div>
      {group && (
        <div className="mb-2 flex items-center gap-2">
          <CategoryBadge
            category={CATEGORY_LABEL[group.category] ?? group.category}
          />
          {/* 상태 배지: 모집중(파랑) / 활동중(초록). 완료는 표시 없음 */}
          {group.status === "RECRUITING" && (
            <Badge variant="recruiting" className="rounded-full">
              모집중
            </Badge>
          )}
          {group.status === "ACTIVE" && (
            <Badge variant="active" className="rounded-full">
              활동중
            </Badge>
          )}
          {group.isLeader && <HostBadge />}
        </div>
      )}
      <h1 className="text-2xl font-semibold tracking-normal">
        {group?.title ?? "모임을 선택해주세요"}
      </h1>
    </div>
  )
}
