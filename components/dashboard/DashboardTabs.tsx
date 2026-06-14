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
              "border-b-2 border-transparent px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground",
              isActive && "border-foreground font-medium text-foreground",
            )}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
