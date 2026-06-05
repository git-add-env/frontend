import Link from "next/link"
import { Users, CalendarCheck, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"

const features = [
  {
    icon: Users,
    title: "함께할 사람 찾기",
    description: "프로젝트·해커톤·공모전, 목표가 같은 팀원을 한곳에서 만나요.",
  },
  {
    icon: CalendarCheck,
    title: "일정까지 한 번에",
    description: "모임 생성부터 일정 조율, 참여 관리까지 흐름 끊김 없이.",
  },
  {
    icon: Sparkles,
    title: "맞춤 추천",
    description: "관심사와 활동에 맞춰 어울리는 모임을 추천해 드려요.",
  },
]

export default function LandingPage() {
  return (
    <div className="flex w-full flex-col">
      {/* Hero */}
      <section className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-6 py-20 text-center md:py-28">
        <span className="rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
          함께할 사람을 찾는 가장 쉬운 방법
        </span>
        <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
          모여<span className="text-[#1abcfe]">ON</span>에서
          <br className="hidden sm:block" /> 마음 맞는 팀을 만나세요
        </h1>
        <p className="max-w-xl text-base text-muted-foreground md:text-lg">
          프로젝트, 해커톤, 공모전까지. 흩어진 사람들을 모아 하나의 팀으로.
          지금 바로 모임을 찾거나 직접 열어보세요.
        </p>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/meetings">모임 찾기</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/login">시작하기</Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto grid w-full max-w-6xl gap-4 px-6 pb-24 md:grid-cols-3">
        {features.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="flex flex-col gap-3 rounded-xl border border-border bg-card p-6 text-card-foreground"
          >
            <div className="flex size-10 items-center justify-center rounded-lg bg-[#1abcfe]/10 text-[#1abcfe]">
              <Icon className="size-5" />
            </div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        ))}
      </section>
    </div>
  )
}
