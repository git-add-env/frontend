"use client"

import { useState } from "react"
import { MessageSquareIcon, PlusIcon, UsersIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

type OnboardingDialogProps = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  previewMode?: boolean
  showTrigger?: boolean
}

const jobs = ["프론트엔드 개발자", "백엔드 개발자", "풀스택 개발자", "디자이너", "기획자", "PM"]
const careers = ["신입", "1-3년", "4-6년", "7년 이상"]
const skills = [
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "Node.js",
  "Vue.js",
  "Python",
  "Django",
  "Java",
  "Spring",
  "Kotlin",
  "Swift",
  "Go",
  "Flutter",
  "AWS",
  "Docker",
  "PostgreSQL",
  "MySQL",
]

function ProgressDots({ step }: { step: number }) {
  return (
    <div className="mx-auto flex w-full max-w-40 items-center justify-center px-2">
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="flex flex-1 items-center last:flex-none">
          <div
            className={cn(
              "flex size-5 items-center justify-center rounded-full text-[11px] font-semibold",
              step === item ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
            )}
          >
            {item}
          </div>
          {item < 4 && <div className="h-px flex-1 bg-border" />}
        </div>
      ))}
    </div>
  )
}

export default function OnboardingDialog({
  open,
  onOpenChange,
  previewMode = false,
  showTrigger = true,
}: OnboardingDialogProps) {
  const router = useRouter()
  const { data: session, update } = useSession()
  const [internalOpen, setInternalOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [nickname, setNickname] = useState("")
  const [job, setJob] = useState("")
  const [career, setCareer] = useState("")
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [bio, setBio] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const requiresOnboarding = Boolean(session?.onboardingRequired)
  const controlledOpen = open ?? internalOpen
  const dialogOpen = requiresOnboarding || controlledOpen

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setStep(0)
    }

    if (onOpenChange) {
      onOpenChange(nextOpen)
      return
    }

    setInternalOpen(nextOpen)
  }

  function toggleSkill(skill: string) {
    setSelectedSkills((current) =>
      current.includes(skill) ? current.filter((item) => item !== skill) : [...current, skill]
    )
  }

  async function completeOnboarding() {
    if (previewMode) {
      setStep(5)
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/auth/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname, job: job || career }),
      })

      if (!response.ok) {
        throw new Error("온보딩에 실패했습니다.")
      }

      const result = await response.json()

      await update({
        accessToken: result.accessToken,
        user: result.user,
      })

      setStep(5)
      router.refresh()
    } finally {
      setIsSubmitting(false)
    }
  }

  function startApp() {
    handleOpenChange(false)
    router.replace("/")
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      {showTrigger && (
        <DialogTrigger asChild>
          <Button size="sm">온보딩</Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-md px-8 py-7" showCloseButton={previewMode || !requiresOnboarding}>
        {step >= 1 && step <= 4 && <ProgressDots step={step} />}

        {step === 0 && (
          <div className="grid gap-8 py-8 text-center">
            <DialogHeader className="items-center text-center">
              <DialogTitle className="text-2xl">환영합니다! 👋</DialogTitle>
              <DialogDescription>
                간단한 정보를 입력하고
                <br />
                맞춤형 모임과 경험을 시작해요.
              </DialogDescription>
            </DialogHeader>
            <Button className="h-11" onClick={() => setStep(1)}>
              정보 입력하기
            </Button>
          </div>
        )}

        {step === 1 && (
          <div className="grid gap-7 py-2">
            <DialogHeader className="items-center text-center">
              <DialogTitle className="text-xl">닉네임을 알려주세요</DialogTitle>
              <DialogDescription>다른 사용자에게 표시될 이름이에요.</DialogDescription>
            </DialogHeader>
            <label className="grid gap-2 text-sm font-medium">
              <input
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
                placeholder="닉네임을 입력해주세요"
                maxLength={20}
                className="h-12 rounded-md border bg-background px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <span className="text-xs font-normal text-muted-foreground">2-20자 이내</span>
            </label>
            <Button className="h-11" onClick={() => setStep(2)} disabled={nickname.trim().length < 2}>
              다음
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-6 py-2">
            <DialogHeader className="items-center text-center">
              <DialogTitle className="text-xl">직무와 경력을 알려주세요</DialogTitle>
              <DialogDescription>더 적합한 모임과 정보를 추천해드려요.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <label className="grid gap-2 text-sm font-medium">
                직무
                <select
                  value={job}
                  onChange={(event) => setJob(event.target.value)}
                  className="h-12 rounded-md border bg-background px-4 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">직무를 선택하세요</option>
                  {jobs.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium">
                경력
                <select
                  value={career}
                  onChange={(event) => setCareer(event.target.value)}
                  className="h-12 rounded-md border bg-background px-4 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">경력을 선택하세요</option>
                  {careers.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <Button className="h-11" onClick={() => setStep(3)} disabled={!job || !career}>
              다음
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-5 py-2">
            <DialogHeader className="items-center text-center">
              <DialogTitle className="text-xl">기술 스택을 선택해주세요</DialogTitle>
              <DialogDescription>
                관심 있는 기술을 선택하면
                <br />
                맞춤형 모임과 정보를 추천해드려요.
              </DialogDescription>
            </DialogHeader>
            <input
              placeholder="기술을 검색하세요"
              className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <div className="grid grid-cols-3 gap-2">
              {skills.map((skill) => {
                const selected = selectedSkills.includes(skill)

                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={cn(
                      "h-9 cursor-pointer rounded-md border px-2 text-xs font-medium transition-colors",
                      selected
                        ? "border-foreground bg-foreground text-background"
                        : "bg-background hover:bg-muted"
                    )}
                  >
                    {skill}
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-muted-foreground">복수 선택 가능</p>
            <Button className="h-11" onClick={() => setStep(4)} disabled={selectedSkills.length === 0}>
              다음
            </Button>
          </div>
        )}

        {step === 4 && (
          <div className="grid gap-6 py-2">
            <DialogHeader className="items-center text-center">
              <DialogTitle className="text-xl">간단한 소개를 남겨주세요 <span className="text-muted-foreground">(선택)</span></DialogTitle>
              <DialogDescription>관심사나 한 줄 소개를 남겨보세요.</DialogDescription>
            </DialogHeader>
            <label className="grid gap-2">
              <textarea
                value={bio}
                onChange={(event) => setBio(event.target.value.slice(0, 200))}
                placeholder="자기소개를 입력해주세요 (선택)"
                className="min-h-32 resize-none rounded-md border bg-background p-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <span className="text-right text-xs text-muted-foreground">{bio.length}/200</span>
            </label>
            <Button className="h-11" onClick={completeOnboarding} disabled={isSubmitting}>
              {isSubmitting ? "저장 중..." : "완료"}
            </Button>
            <Button type="button" variant="ghost" onClick={completeOnboarding} disabled={isSubmitting}>
              건너뛰기
            </Button>
          </div>
        )}

        {step === 5 && (
          <div className="grid gap-8 py-8 text-center">
            <DialogHeader className="items-center text-center">
              <DialogTitle className="text-2xl">회원가입이 완료되었어요! 🎉</DialogTitle>
              <DialogDescription>이제 모임을 만들거나 참여해보세요.</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-3 gap-3 text-xs font-medium">
              <div className="grid gap-2">
                <UsersIcon className="mx-auto size-8 rounded-full bg-muted p-1.5" />
                관심사에 맞는<br />모임 찾기
              </div>
              <div className="grid gap-2">
                <PlusIcon className="mx-auto size-8 rounded-full bg-muted p-1.5" />
                나만의 모임<br />만들기
              </div>
              <div className="grid gap-2">
                <MessageSquareIcon className="mx-auto size-8 rounded-full bg-muted p-1.5" />
                개발자들과<br />소통하기
              </div>
            </div>
            <Button className="h-11" onClick={startApp}>
              시작하기
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
