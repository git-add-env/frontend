import type { ReactNode } from "react"

type EmptyOrErrorProps = {
  message: string
  // 빈 상태에서 행동을 유도할 선택적 CTA. 에러/로딩 상태에는 넘기지 않는다.
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
