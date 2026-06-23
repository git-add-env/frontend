"use client"

import { cn } from "@/lib/utils"

type DashboardTabsProps<T extends string> = {
  tabs: readonly { key: T; label: string }[]
  active: T
  onChange: (key: T) => void
}

// 키 타입(T)을 보존하는 제네릭 탭 바. onChange는 정확한 키 타입으로 호출된다.
export function DashboardTabs<T extends string>({
  tabs,
  active,
  onChange,
}: DashboardTabsProps<T>) {
  return (
    <div className="flex gap-1 border-b border-border">
      {tabs.map((tab) => {
        const isActive = active === tab.key
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={cn(
              "relative flex shrink-0 items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground",
              isActive && "font-semibold text-foreground",
            )}
          >
            {tab.label}
            {/* 활성 탭 밑줄 — 마이페이지와 동일한 양끝 둥근 막대 */}
            {isActive && (
              <span className="absolute inset-x-3 -bottom-px h-[3px] rounded-full bg-brand" />
            )}
          </button>
        )
      })}
    </div>
  )
}
