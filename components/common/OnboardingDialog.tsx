"use client"

import { useMemo, useState } from "react"
import {
  ChevronDownIcon,
  MessageSquareIcon,
  PlusIcon,
  UsersIcon,
} from "lucide-react"
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
import {
  ONBOARDING_CAREER_OPTIONS,
  ONBOARDING_INTRODUCTION_MAX_LENGTH,
  ONBOARDING_JOB_OPTIONS,
  ONBOARDING_NICKNAME_MAX_LENGTH,
  ONBOARDING_TECH_STACK_OPTIONS,
} from "@/constants/onboarding"
import { notify } from "@/lib/notify"
import { cn } from "@/lib/utils"

type OnboardingDialogProps = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  previewMode?: boolean
  showTrigger?: boolean
}

function ProgressDots({ step }: { step: number }) {
  return (
    <div className="mx-auto flex w-full max-w-40 items-center justify-center px-2">
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="flex flex-1 items-center last:flex-none">
          <div
            className={cn(
              "flex size-5 items-center justify-center rounded-full text-[11px] font-semibold",
              step === item
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground"
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
  const [isJobDropdownOpen, setIsJobDropdownOpen] = useState(false)
  const [career, setCareer] = useState("")
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [skillQuery, setSkillQuery] = useState("")
  const [introduction, setIntroduction] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const requiresOnboarding = Boolean(session?.onboardingRequired)
  const controlledOpen = open ?? internalOpen
  const dialogOpen = requiresOnboarding || controlledOpen
  const filteredSkills = useMemo(() => {
    const query = skillQuery.trim().toLowerCase()

    return query
      ? ONBOARDING_TECH_STACK_OPTIONS.filter((skill) =>
          skill.toLowerCase().includes(query)
        )
      : ONBOARDING_TECH_STACK_OPTIONS
  }, [skillQuery])

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && requiresOnboarding && !previewMode) {
      return
    }

    if (!nextOpen) {
      setStep(0)
      setErrorMessage("")
      setIsJobDropdownOpen(false)
    }

    if (onOpenChange) {
      onOpenChange(nextOpen)
      return
    }

    setInternalOpen(nextOpen)
  }

  function toggleSkill(skill: string) {
    setSelectedSkills((current) =>
      current.includes(skill)
        ? current.filter((item) => item !== skill)
        : [...current, skill]
    )
  }

  async function completeOnboarding() {
    if (previewMode) {
      setStep(5)
      return
    }

    setIsSubmitting(true)
    setErrorMessage("")

    try {
      const response = await fetch("/api/auth/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: nickname.trim(),
          job,
          career,
          techStacks: selectedSkills,
          introduction: introduction.trim() || null,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result?.message ?? "온보딩에 실패했습니다.")
      }

      // 세션 플래그가 해제되더라도 완료 화면은 사용자가 직접 닫을 때까지 유지한다.
      setStep(5)
      setInternalOpen(true)

      await update({
        accessToken: result.accessToken ?? session?.accessToken,
        user: result.user,
        onboardingRequired: false,
      })

      notify.success("회원가입이 완료되었습니다.", {
        description: "이제 관심사에 맞는 모임을 찾아볼 수 있어요.",
      })
      router.refresh()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "온보딩에 실패했습니다."
      setErrorMessage(message)
      notify.error(message)
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
      <DialogContent
        className="max-h-[92vh] max-w-md overflow-y-auto px-8 py-7"
        showCloseButton={previewMode || !requiresOnboarding}
      >
        {step >= 1 && step <= 4 && <ProgressDots step={step} />}

        {step === 0 && (
          <div className="grid gap-8 py-8 text-center">
            <DialogHeader className="items-center text-center">
              <DialogTitle className="text-2xl">환영합니다</DialogTitle>
              <DialogDescription>
                간단한 정보를 입력하고
                <br />
                나에게 맞는 모임을 찾아보세요.
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
              <DialogDescription>
                다른 사용자에게 표시될 이름입니다.
              </DialogDescription>
            </DialogHeader>
            <label className="grid gap-2 text-sm font-medium">
              닉네임
              <input
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
                placeholder="닉네임을 입력해주세요"
                maxLength={ONBOARDING_NICKNAME_MAX_LENGTH}
                className="h-12 rounded-md border bg-background px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <span className="text-xs font-normal text-muted-foreground">
                2-10자 이내
              </span>
            </label>
            <Button
              className="h-11"
              onClick={() => setStep(2)}
              disabled={nickname.trim().length < 2}
            >
              다음
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-6 py-2">
            <DialogHeader className="items-center text-center">
              <DialogTitle className="text-xl">
                직종과 경력을 선택해주세요
              </DialogTitle>
              <DialogDescription>
                관심사에 맞는 모임 추천에 사용합니다.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="grid gap-2 text-sm font-medium">
                직종
                <div
                  className="relative"
                  onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget)) {
                      setIsJobDropdownOpen(false)
                    }
                  }}
                >
                  <button
                    type="button"
                    aria-haspopup="listbox"
                    aria-expanded={isJobDropdownOpen}
                    onClick={() => setIsJobDropdownOpen((open) => !open)}
                    className="flex h-12 w-full items-center justify-between rounded-md border bg-background px-4 text-left text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className={cn(!job && "text-muted-foreground")}>
                      {job || "직종을 선택해주세요"}
                    </span>
                    <ChevronDownIcon
                      className={cn(
                        "size-4 shrink-0 text-muted-foreground transition-transform",
                        isJobDropdownOpen && "rotate-180"
                      )}
                    />
                  </button>
                  {isJobDropdownOpen && (
                    <div
                      role="listbox"
                      className="absolute top-full z-50 mt-2 grid max-h-44 w-full overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
                    >
                      {ONBOARDING_JOB_OPTIONS.map((item) => (
                        <button
                          key={item}
                          type="button"
                          role="option"
                          aria-selected={job === item}
                          onClick={() => {
                            setJob(item)
                            setIsJobDropdownOpen(false)
                          }}
                          className={cn(
                            "cursor-pointer rounded-sm px-3 py-2 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground",
                            job === item && "bg-accent text-accent-foreground"
                          )}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <label className="grid gap-2 text-sm font-medium">
                경력
                <select
                  value={career}
                  onChange={(event) => setCareer(event.target.value)}
                  className="h-12 rounded-md border bg-background px-4 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">경력을 선택해주세요</option>
                  {ONBOARDING_CAREER_OPTIONS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <Button
              className="h-11"
              onClick={() => setStep(3)}
              disabled={!job || !career}
            >
              다음
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-5 py-2">
            <DialogHeader className="items-center text-center">
              <DialogTitle className="text-xl">
                기술 스택을 선택해주세요
              </DialogTitle>
              <DialogDescription>
                하나 이상 선택하면 더 정확하게 추천할 수 있습니다.
              </DialogDescription>
            </DialogHeader>
            <input
              value={skillQuery}
              onChange={(event) => setSkillQuery(event.target.value)}
              placeholder="기술 스택 검색"
              className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <div className="grid max-h-56 grid-cols-3 gap-2 overflow-y-auto pr-1">
              {filteredSkills.map((skill) => {
                const selected = selectedSkills.includes(skill)

                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={cn(
                      "min-h-9 cursor-pointer rounded-md border px-2 py-1 text-xs font-medium transition-colors",
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
            <p className="text-xs text-muted-foreground">
              {selectedSkills.length}개 선택됨
            </p>
            <Button
              className="h-11"
              onClick={() => setStep(4)}
              disabled={selectedSkills.length === 0}
            >
              다음
            </Button>
          </div>
        )}

        {step === 4 && (
          <div className="grid gap-6 py-2">
            <DialogHeader className="items-center text-center">
              <DialogTitle className="text-xl">
                간단한 소개를 남겨주세요{" "}
                <span className="text-muted-foreground">(선택)</span>
              </DialogTitle>
              <DialogDescription>
                관심사나 목표를 짧게 적어보세요.
              </DialogDescription>
            </DialogHeader>
            <label className="grid gap-2">
              <textarea
                value={introduction}
                onChange={(event) =>
                  setIntroduction(
                    event.target.value.slice(
                      0,
                      ONBOARDING_INTRODUCTION_MAX_LENGTH
                    )
                  )
                }
                placeholder="자기소개를 입력해주세요"
                className="min-h-32 resize-none rounded-md border bg-background p-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <span className="text-right text-xs text-muted-foreground">
                {introduction.length}/{ONBOARDING_INTRODUCTION_MAX_LENGTH}
              </span>
            </label>
            {errorMessage && (
              <p className="text-sm font-medium text-destructive">
                {errorMessage}
              </p>
            )}
            <Button
              className="h-11"
              onClick={completeOnboarding}
              disabled={isSubmitting}
            >
              {isSubmitting ? "처리 중..." : "완료"}
            </Button>
          </div>
        )}

        {step === 5 && (
          <div className="grid gap-8 py-8 text-center">
            <DialogHeader className="items-center text-center">
              <DialogTitle className="text-2xl">
                회원가입이 완료되었습니다
              </DialogTitle>
              <DialogDescription>
                이제 모임을 만들거나 참여할 수 있습니다.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-3 gap-3 text-xs font-medium">
              <div className="grid gap-2">
                <UsersIcon className="mx-auto size-8 rounded-full bg-muted p-1.5" />
                관심사에 맞는
                <br />
                모임 찾기
              </div>
              <div className="grid gap-2">
                <PlusIcon className="mx-auto size-8 rounded-full bg-muted p-1.5" />
                나만의 모임
                <br />
                만들기
              </div>
              <div className="grid gap-2">
                <MessageSquareIcon className="mx-auto size-8 rounded-full bg-muted p-1.5" />
                개발자들과
                <br />
                소통하기
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
