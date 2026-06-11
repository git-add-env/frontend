import {
  Badge,
  CategoryBadge,
  JobCountBadge,
  MemberCountBadge,
  TechStackBadges,
} from "@/components/ui/badge"
import { AlarmClock, CircleStar } from "lucide-react"

type PositionCount = {
  job: string
  current: number
  max: number
}

type PositionJobCountBadgesProps = {
  jobs: PositionCount[]
  className?: string
  badgeClassName?: string
}

export function PositionJobCountBadges({
  jobs,
  className,
  badgeClassName,
}: PositionJobCountBadgesProps) {
  return (
    <div className={className}>
      {jobs.map((job) => (
        <JobCountBadge
          key={job.job}
          job={job.job}
          current={job.current}
          max={job.max}
          className={badgeClassName}
        />
      ))}
    </div>
  )
}

export function Badges() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="dday">D - DAY </Badge>
      <Badge variant="deadline">마감</Badge>
      <Badge variant="today">
        <AlarmClock />
        오늘 마감
      </Badge>
      <Badge variant="recruiting">모집중</Badge>
      <Badge variant="host">
        <CircleStar />
        모임장
      </Badge>
      <CategoryBadge category="프로젝트" />
      <CategoryBadge category="해커톤" />
      <CategoryBadge category="공모전" />
      <PositionJobCountBadges
        jobs={[
          { job: "프론트엔드", current: 3, max: 6 },
          { job: "백엔드", current: 2, max: 4 },
          { job: "디자인", current: 1, max: 2 },
        ]}
        className="flex flex-wrap gap-2"
      />
      <MemberCountBadge current={4} max={6} />
      <MemberCountBadge current={8} max={8} />
      <TechStackBadges techStacks={["React", "TypeScript", "Next.js"]} />
    </div>
  )
}
