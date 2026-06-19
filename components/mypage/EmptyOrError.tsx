import type { ReactNode } from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"

type EmptyOrErrorProps = {
  message: string
  // 빈 상태에서 행동을 유도할 CTA(예: "모임 찾기"). 에러/로딩 상태에는 넘기지 않는다.
  action?: ReactNode
}

export function EmptyOrError({ message, action }: EmptyOrErrorProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
      <p>{message}</p>
      {action}
    </div>
  )
}

// 빈 탭에서 모임찾기 페이지로 유도하는 공용 CTA 버튼.
export function FindMeetingsButton() {
  return (
    <Button asChild size="sm">
      <Link href="/meetings">모임 찾기</Link>
    </Button>
  )
}
