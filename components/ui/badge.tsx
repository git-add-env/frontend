import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"
import { Crown, Users } from "lucide-react"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-8 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-sm border border-transparent px-2 py-0.5 text-xs font-bold whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        secondary:
          "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive:
          "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
        outline:
          "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost:
          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
        // 모임장/멤버처럼 강조용 솔리드 배지
        solid: "bg-foreground text-background",
        // 화상 회의 등 액센트 배지
        accent: "bg-accent text-accent-foreground",
        // 카테고리/기술스택/상태처럼 잔잔한 배지
        muted: "bg-muted text-foreground",
        // 진행중/성공 상태
        success:
          "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
        // 모집중: 모집 진행 중 상태 (파란 톤)
        recruiting:
          "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
        // 활동중: 모임 진행 중 상태 (초록 톤)
        active:
          "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
        // 마감(종료): 흰 배경 + 검은 텍스트
        deadline: "bg-white text-black border-border",
        // 디데이(D-7 등): 흰 배경 + 회색 텍스트
        dday: "bg-white text-gray-500 border-border",
        // 오늘 마감: 흰 배경 + 빨간 텍스트
        today: "bg-red-50 text-red-500 border-red-500",
        // 모임장: 흰 배경 + 살짝 어두운 노란 테두리
        host: "rounded-3xl bg-white text-yellow-500 border-yellow-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

// 모임장 배지 — 노란 테두리 + 왕관(Crown) 아이콘 고정
function HostBadge({
  className,
  ...props
}: Omit<React.ComponentProps<typeof Badge>, "variant" | "children">) {
  return (
    <Badge variant="host" className={className} {...props}>
      <Crown />
      모임장
    </Badge>
  )
}

// 기술 스택 배지 — 잔잔한 muted 배지 (텍스트 앞에 # 붙임)
function TechStackBadge({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Badge>) {
  return (
    <Badge
      variant="muted"
      className={cn(
        "border-[#1abcfe]/25 bg-[#1abcfe]/5 text-[#007caf]",
        className,
      )}
      {...props}
    >
      #{children}
    </Badge>
  )
}

// 기술 스택 목록을 배지 여러 개로 — techStacks 배열을 받아 wrap
function TechStackBadges({
  techStacks,
  className,
}: {
  techStacks: string[]
  className?: string
}) {
  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {techStacks.map((stack) => (
        <TechStackBadge key={stack}>{stack}</TechStackBadge>
      ))}
    </div>
  )
}

// 정원/인원 배지 — 현재/최대 인원 (꽉 차면 solid 로 강조) + 인원 아이콘
function MemberCountBadge({
  current,
  max,
  className,
  ...props
}: Omit<React.ComponentProps<typeof Badge>, "variant" | "children"> & {
  current: number
  max: number
}) {
  const isFull = current >= max
  return (
    <Badge variant={isFull ? "solid" : "muted"} className={className} {...props}>
      <Users />
      {current}/{max}
    </Badge>
  )
}

// 직군 배지 — 직군명을 공통 스타일로 표시
function JobBadge({
  job,
  className,
  ...props
}: Omit<React.ComponentProps<typeof Badge>, "variant" | "children"> & {
  job: string
}) {
  return (
    <Badge
      variant="outline"
      className={className}
      {...props}
    >
      {job}
    </Badge>
  )
}

// 직군 + 정원 합본 배지 — "프론트엔드 3/6" 처럼 직군명과 인원 카운트 표시
function JobCountBadge({
  job,
  current,
  max,
  className,
  ...props
}: Omit<React.ComponentProps<typeof Badge>, "variant" | "children"> & {
  job: string
  current: number
  max: number
}) {
  return (
    <Badge
      variant="outline"
      className={className}
      {...props}
    >
      <Users />
      {job} <span className="meeting-job-count">{current}/{max}</span>
    </Badge>
  )
}

// 카테고리별 색상 (프로젝트/해커톤/공모전)
const CATEGORY_BADGE_STYLES: Record<string, string> = {
  프로젝트: "bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400",
  해커톤: "bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400",
  공모전: "bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400",
}

// 카테고리 배지 — 카테고리명을 받아 카테고리별 색으로. 모르는 값이면 outline 폴백
function CategoryBadge({
  category,
  className,
  ...props
}: Omit<React.ComponentProps<typeof Badge>, "variant" | "children"> & {
  category: string
}) {
  const style = CATEGORY_BADGE_STYLES[category]
  return (
    <Badge
      variant={style ? "muted" : "outline"}
      className={cn("rounded-full border-border", style, className)}
      {...props}
    >
      {category}
    </Badge>
  )
}

export {
  Badge,
  badgeVariants,
  HostBadge,
  TechStackBadge,
  TechStackBadges,
  MemberCountBadge,
  JobBadge,
  JobCountBadge,
  CategoryBadge,
  CATEGORY_BADGE_STYLES,
}
