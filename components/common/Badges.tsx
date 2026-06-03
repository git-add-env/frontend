import {
    Badge,
    CategoryBadge,
    JobCountBadge,
    MemberCountBadge,
    TechStackBadges,
} from "@/components/ui/badge"
import { AlarmClock, CircleStar } from "lucide-react"

export function Badges() {
    return (
        <div className="flex flex-wrap items-center gap-2">
            <Badge variant="dday">D - DAY </Badge>
            <Badge variant="deadline">마감</Badge>
            <Badge variant="today"><AlarmClock />오늘 마감</Badge>
            <Badge variant="recruiting">모집중</Badge>
            <Badge variant="host"><CircleStar />모임장</Badge>
            {/* 카테고리 배지 — 카테고리별 색상 */}
            <CategoryBadge category="프로젝트" />
            <CategoryBadge category="해커톤" />
            <CategoryBadge category="공모전" />
            {/* 직군 + 정원 합본 배지 — "프론트엔드 3/6" */}
            <JobCountBadge job="프론트엔드" current={3} max={6} />
            <JobCountBadge job="백엔드" current={2} max={4} />
            <JobCountBadge job="디자인" current={1} max={2} />
            {/* 정원/인원 배지 — 꽉 차면 solid 로 강조 */}
            <MemberCountBadge current={4} max={6} />
            <MemberCountBadge current={8} max={8} />
            {/* 기술 스택 배지 목록 */}
            <TechStackBadges techStacks={["React", "TypeScript", "Next.js"]} />
        </div>
    )
}
