"use client"

import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

// 전역 레이아웃 배경. 랜딩(자체 CSS 배경)과 화상회의(conference, 자체 다크 배경)는
// 고유 배경을 쓰므로 제외하고, 그 외 모든 페이지에 공통 배경(#fafafa, 중성 오프화이트)을 적용한다.
function hasOwnBackground(pathname: string) {
  if (pathname === "/landing" || pathname.startsWith("/landing/")) {
    return true
  }

  // /meetings/{id}/conference
  if (/^\/meetings\/[^/]+\/conference(\/|$)/.test(pathname)) {
    return true
  }

  return false
}

export function MainArea({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const excluded = hasOwnBackground(pathname)

  return <main className={cn("flex-1", !excluded && "bg-[#fafafa]")}>{children}</main>
}
