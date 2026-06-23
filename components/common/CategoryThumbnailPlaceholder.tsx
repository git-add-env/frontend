"use client"

import { FolderGit2, Trophy, Zap, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

const CATEGORY_THUMB: Record<string, { gradient: string; Icon: LucideIcon }> = {
  PROJECT: { gradient: "from-indigo-500 to-violet-500", Icon: FolderGit2 },
  HACKATHON: { gradient: "from-orange-500 to-pink-500", Icon: Zap },
  CONTEST: { gradient: "from-teal-400 to-sky-500", Icon: Trophy },
}

type CategoryThumbnailPlaceholderProps = {
  category: string
  className?: string
  iconClassName?: string
}

export function CategoryThumbnailPlaceholder({
  category,
  className,
  iconClassName,
}: CategoryThumbnailPlaceholderProps) {
  const { gradient, Icon } = CATEGORY_THUMB[category] ?? {
    gradient: "from-slate-400 to-slate-500",
    Icon: FolderGit2,
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center bg-gradient-to-br text-white",
        gradient,
        className,
      )}
    >
      <Icon className={cn("size-9", iconClassName)} aria-hidden="true" />
    </div>
  )
}
