"use client"

import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  CalendarDays,
  ChevronDown,
  FileText,
  ImagePlus,
  Info,
  LoaderCircle,
  Plus,
  Save,
  Trash2,
  Upload,
  Users,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { MEETING_CATEGORY_OPTIONS } from "@/constants/meeting-form"
import {
  ONBOARDING_JOB_OPTIONS,
  ONBOARDING_TECH_STACK_OPTIONS,
} from "@/constants/onboarding"
import { queryKeys } from "@/hooks/api/query-keys"
import {
  createMeeting,
  fetchMeetingDetail,
  getMeetingMutationId,
  normalizeMeetingPositions,
  updateMeeting,
  type MeetingDetail,
  type MeetingUpsertPayload,
} from "@/lib/api/meetings"
import { notify } from "@/lib/notify"
import { cn } from "@/lib/utils"

type MeetingCreateProps = {
  meetingId?: number
}

type PositionForm = {
  id: string
  serverId?: number
  name: string
  recruitCount: number
  description: string
}

type MeetingFormState = {
  title: string
  category: string
  thumbnailUrl: string
  deadline: string
  startDate: string
  expectedDuration: string
  meetingSchedule: string
  description: string
  techStackInput: string
  techStacks: string[]
  referenceNote: string
  positions: PositionForm[]
}

const FORM_ID = "meeting-upsert-form"
const SECTION_NAV_ITEMS = [
  { id: "basic-info", label: "기본 정보", icon: Info },
  { id: "introduction", label: "모집 소개", icon: FileText },
  { id: "schedule", label: "진행 방식", icon: CalendarDays },
  { id: "positions", label: "모집 포지션", icon: Users },
] as const

type SectionId = (typeof SECTION_NAV_ITEMS)[number]["id"]

const INITIAL_FORM: MeetingFormState = {
  title: "",
  category: "PROJECT",
  thumbnailUrl: "",
  deadline: "",
  startDate: "",
  expectedDuration: "1개월 미만",
  meetingSchedule: "주 1회",
  description: "",
  techStackInput: "",
  techStacks: ["React", "TypeScript", "Tailwind CSS"],
  referenceNote: "",
  positions: [
    {
      id: "position-1",
      name: "",
      recruitCount: 1,
      description: "",
    },
  ],
}

const DURATION_OPTIONS = ["1개월 미만", "1-3개월", "3-6개월", "6개월 이상"] as const
const SCHEDULE_OPTIONS = ["주 1회", "주 2회", "주 3회 이상", "협의 후 결정"] as const

export function MeetingCreate({ meetingId }: MeetingCreateProps) {
  const isEditMode = typeof meetingId === "number" && Number.isFinite(meetingId)
  const detailQuery = useQuery({
    queryKey: isEditMode ? queryKeys.meetings.detail(meetingId) : ["meetings", "create"],
    queryFn: () => fetchMeetingDetail(meetingId as number),
    enabled: isEditMode,
  })

  if (detailQuery.isLoading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-xl border border-[#c3c6d7] bg-white">
        <LoaderCircle className="size-6 animate-spin text-blue-400" aria-hidden="true" />
        <span className="ml-2 text-sm text-[#565e74]">모임 정보를 불러오는 중입니다.</span>
      </div>
    )
  }

  if (detailQuery.isError) {
    return (
      <div className="rounded-xl border border-dashed border-[#c3c6d7] bg-white p-10 text-center text-[#565e74]">
        모임 정보를 불러오지 못했습니다.
      </div>
    )
  }

  const initialForm = detailQuery.data ? mapMeetingDetailToForm(detailQuery.data) : INITIAL_FORM

  return (
    <MeetingCreateForm
      key={isEditMode ? `edit-${meetingId}` : "create"}
      initialForm={initialForm}
      isEditMode={isEditMode}
      meetingId={meetingId}
    />
  )
}

type MeetingCreateFormProps = {
  initialForm: MeetingFormState
  isEditMode: boolean
  meetingId?: number
}

function MeetingCreateForm({ initialForm, isEditMode, meetingId }: MeetingCreateFormProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<MeetingFormState>(initialForm)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [activeSectionId, setActiveSectionId] = useState<SectionId>("basic-info")

  const completion = useMemo(() => getCompletion(form), [form])
  const totalRecruitCount = useMemo(
    () => form.positions.reduce((total, position) => total + position.recruitCount, 0),
    [form.positions],
  )
  const selectedPositionNames = useMemo(
    () => form.positions.map((position) => position.name).filter(Boolean),
    [form.positions],
  )
  const canAddPosition = form.positions.length < ONBOARDING_JOB_OPTIONS.length
  const filteredTechStackOptions = useMemo(() => {
    const query = form.techStackInput.trim().toLowerCase()

    return query
      ? ONBOARDING_TECH_STACK_OPTIONS.filter((stack) => stack.toLowerCase().includes(query))
      : ONBOARDING_TECH_STACK_OPTIONS
  }, [form.techStackInput])

  const mutation = useMutation({
    mutationFn: (payload: MeetingUpsertPayload) =>
      isEditMode && typeof meetingId === "number"
        ? updateMeeting(meetingId, payload)
        : createMeeting(payload),
    onSuccess: async (data) => {
      const nextMeetingId = getMeetingMutationId(data)

      await queryClient.invalidateQueries({ queryKey: queryKeys.meetings.list })
      await queryClient.invalidateQueries({ queryKey: queryKeys.meetings.mineAll })
      await queryClient.invalidateQueries({ queryKey: queryKeys.meetings.detail(nextMeetingId) })

      notify.success(isEditMode ? "모임이 수정되었습니다." : "모임이 생성되었습니다.")
      router.push(`/meetings/${nextMeetingId}`)
    },
    onError: () => {
      notify.error(isEditMode ? "모임 수정에 실패했습니다." : "모임 생성에 실패했습니다.")
    },
  })

  useEffect(() => {
    const sections = SECTION_NAV_ITEMS.map((item) => document.getElementById(item.id)).filter(
      (section): section is HTMLElement => section !== null,
    )

    if (sections.length === 0) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]

        if (!visibleEntry) {
          return
        }

        const nextSectionId = visibleEntry.target.id as SectionId

        setActiveSectionId((prev) => (prev === nextSectionId ? prev : nextSectionId))
      },
      {
        rootMargin: "-25% 0px -55% 0px",
        threshold: [0.1, 0.25, 0.5, 0.75],
      },
    )

    sections.forEach((section) => observer.observe(section))

    return () => observer.disconnect()
  }, [])

  function updateField<K extends keyof MeetingFormState>(key: K, value: MeetingFormState[K]) {
    setFieldError(null)
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleAddTechStack(stack: string) {
    const nextStack = stack.trim()

    if (!nextStack || form.techStacks.includes(nextStack)) {
      return
    }

    updateField("techStacks", [...form.techStacks, nextStack])
    updateField("techStackInput", "")
  }

  function handleTechStackKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") {
      return
    }

    event.preventDefault()
    handleAddTechStack(form.techStackInput)
  }

  function handleRemoveTechStack(stack: string) {
    updateField(
      "techStacks",
      form.techStacks.filter((item) => item !== stack),
    )
  }

  function handlePositionChange<K extends keyof PositionForm>(
    positionId: string,
    key: K,
    value: PositionForm[K],
  ) {
    if (
      key === "name" &&
      typeof value === "string" &&
      value &&
      form.positions.some((position) => position.id !== positionId && position.name === value)
    ) {
      setFieldError("이미 선택한 포지션입니다.")
      return
    }

    if (key === "recruitCount" && !isValidRecruitCount(value as number)) {
      setFieldError("포지션별 모집 인원은 1명 이상의 정수여야 합니다.")
      return
    }

    setFieldError(null)
    setForm((prev) => ({
      ...prev,
      positions: prev.positions.map((position) =>
        position.id === positionId ? { ...position, [key]: value } : position,
      ),
    }))
  }

  function handleAddPosition() {
    if (!canAddPosition) {
      setFieldError("선택 가능한 포지션을 모두 추가했습니다.")
      return
    }

    const nextPosition: PositionForm = {
      id: `position-${getStableId()}`,
      name: "",
      recruitCount: 1,
      description: "",
    }

    updateField("positions", [...form.positions, nextPosition])
  }

  function handleRemovePosition(positionId: string) {
    if (form.positions.length === 1) {
      setFieldError("모집 포지션은 최소 1개 이상 필요합니다.")
      return
    }

    updateField(
      "positions",
      form.positions.filter((position) => position.id !== positionId),
    )
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const payload = getPayload(form, { includePositionIds: isEditMode })
    const error = validatePayload(payload)

    if (error) {
      setFieldError(error)
      notify.warning(error)
      return
    }

    mutation.mutate(payload)
  }

  return (
    <div className="flex gap-6 px-0 py-0 lg:items-start">
      <aside className="hidden w-64 shrink-0 self-stretch lg:block">
        <div className="sticky top-24 flex flex-col gap-6">
          <CompletionCard completion={completion} />
          <ProgressNav
            activeSectionId={activeSectionId}
            onSectionSelect={setActiveSectionId}
          />
          <div className="flex flex-col gap-4 border-t border-[#c3c6d7] pt-6">
            <Button
              type="submit"
              form={FORM_ID}
              disabled={mutation.isPending}
              className="h-14 rounded-lg bg-blue-400 text-base text-white hover:bg-blue-500"
            >
              {mutation.isPending ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="size-4" aria-hidden="true" />
              )}
              {isEditMode ? "모임 수정하기" : "모임 생성하기"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => notify.info("임시 저장은 추후 연결 예정입니다.")}
              className="h-14 rounded-lg border-[#c3c6d7] text-base text-blue-500"
            >
              임시 저장
            </Button>
          </div>
        </div>
      </aside>

      <form id={FORM_ID} onSubmit={handleSubmit} className="min-w-0 flex-1 space-y-10 pb-32">
        <header className="space-y-1">
          <h1 className="text-base font-medium leading-6 text-[#191c1e]">
            {isEditMode ? "모임 정보 수정하기" : "새로운 모임 만들기"}
          </h1>
          <p className="text-base leading-6 text-[#434655]">
            함께 성장할 동료를 찾기 위한 정보를 입력해주세요.
          </p>
        </header>

        {fieldError ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {fieldError}
          </p>
        ) : null}

        <FormSection id="basic-info" number={1} title="기본 정보">
          <Field label="모임 카테고리" required>
            <PillControl
              value={form.category}
              options={MEETING_CATEGORY_OPTIONS}
              onChange={(value) => updateField("category", value)}
            />
          </Field>

          <Field label="커버 이미지">
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#c3c6d7] bg-[#f7f9fb] p-10 text-center transition hover:border-blue-400 hover:bg-blue-50">
              {form.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.thumbnailUrl}
                  alt=""
                  className="mb-4 aspect-[1200/630] max-h-52 w-full rounded-lg object-cover"
                />
              ) : (
                <ImagePlus className="mb-3 size-10 text-[#737686]" aria-hidden="true" />
              )}
              <span className="text-base text-[#565e74]">
                이미지를 드래그하거나 클릭하여 업로드하세요
              </span>
              <span className="mt-1 text-base text-[#737686]">1200 x 630px 권장, 최대 5MB</span>
              <span className="mt-4 flex w-full max-w-xl items-center gap-2">
                <Upload className="size-4 text-[#737686]" aria-hidden="true" />
                <Input
                  value={form.thumbnailUrl}
                  onChange={(event: ChangeEvent<HTMLInputElement>) =>
                    updateField("thumbnailUrl", event.target.value)
                  }
                  onClick={(event) => event.stopPropagation()}
                  placeholder="이미지 URL을 입력해주세요."
                  className="h-11 rounded-lg border-[#c3c6d7] bg-white"
                />
              </span>
            </label>
          </Field>

          <div className="grid gap-6 md:grid-cols-2">
            <Field label="모임 제목" required className="md:col-span-2">
              <Input
                value={form.title}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  updateField("title", event.target.value)
                }
                placeholder="예) 러스트로 만드는 실시간 채팅 서버 프로젝트"
                className="h-16 rounded-lg border-[#c3c6d7] bg-white text-base"
              />
            </Field>
            <Field label="모집 마감일" required>
              <Input
                type="date"
                value={form.deadline}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  updateField("deadline", event.target.value)
                }
                className="h-16 rounded-lg border-[#c3c6d7] bg-white text-base"
              />
            </Field>
          </div>
        </FormSection>

        <FormSection id="introduction" number={2} title="모집 소개">
          <Field label="모임 목표 및 소개" required>
            <textarea
              value={form.description}
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                updateField("description", event.target.value)
              }
              placeholder="모임의 목적, 진행 방식, 결과물 등에 대해 상세히 적어주세요."
              className="min-h-52 w-full rounded-lg border border-[#c3c6d7] bg-white px-4 py-4 text-base text-[#191c1e] outline-none transition placeholder:text-[#6b7280] focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
            />
          </Field>

          <Field label="사용 기술 스택" required>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {form.techStacks.map((stack) => (
                  <button
                    key={stack}
                    type="button"
                    onClick={() => handleRemoveTechStack(stack)}
                    className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-500"
                    title={`${stack} 삭제`}
                  >
                    # {stack} ×
                  </button>
                ))}
              </div>
              <TechStackPicker
                inputValue={form.techStackInput}
                options={filteredTechStackOptions}
                selectedOptions={form.techStacks}
                onInputChange={(value) => updateField("techStackInput", value)}
                onInputKeyDown={handleTechStackKeyDown}
                onToggle={(stack) =>
                  form.techStacks.includes(stack)
                    ? handleRemoveTechStack(stack)
                    : handleAddTechStack(stack)
                }
              />
            </div>
          </Field>

          <Field label="기타 참고 사항">
            <Input
              value={form.referenceNote}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                updateField("referenceNote", event.target.value)
              }
              placeholder="사전 과제, 참고 링크 등이 있다면 입력해주세요."
              className="h-14 rounded-lg border-[#c3c6d7] bg-white text-base"
            />
          </Field>
        </FormSection>

        <FormSection id="schedule" number={3} title="진행 정보">
          <div className="grid gap-6 md:grid-cols-3">
            <Field label="시작 예정일" required>
              <Input
                type="date"
                value={form.startDate}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  updateField("startDate", event.target.value)
                }
                className="h-14 rounded-lg border-[#c3c6d7] bg-white text-base"
              />
            </Field>
            <Field label="예상 기간" required>
              <SelectField
                value={form.expectedDuration}
                options={DURATION_OPTIONS}
                onChange={(value) => updateField("expectedDuration", value)}
              />
            </Field>
            <Field label="회의 일정" required>
              <SelectField
                value={form.meetingSchedule}
                options={SCHEDULE_OPTIONS}
                onChange={(value) => updateField("meetingSchedule", value)}
              />
            </Field>
          </div>
        </FormSection>

        <FormSection
          id="positions"
          number={4}
          title="모집 포지션"
          action={
            <button
              type="button"
              onClick={handleAddPosition}
              disabled={!canAddPosition}
              className={cn(
                "inline-flex items-center gap-1 text-base font-medium transition",
                canAddPosition ? "text-blue-500" : "cursor-not-allowed text-[#737686]",
              )}
            >
              <Plus className="size-4" aria-hidden="true" />
              포지션 추가
            </button>
          }
        >
          <div className="space-y-6">
            {form.positions.map((position) => (
              <div
                key={position.id}
                className="relative rounded-xl border border-[#c3c6d7] bg-[#f7f9fb] p-6"
              >
                <button
                  type="button"
                  onClick={() => handleRemovePosition(position.id)}
                  aria-label="포지션 삭제"
                  title="포지션 삭제"
                  className="absolute right-4 top-4 text-[#565e74] transition hover:text-red-600"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
                <div className="grid gap-6 pr-8 md:grid-cols-[minmax(220px,1.4fr)_96px_minmax(260px,2fr)]">
                  <Field label="포지션명" muted>
                    <PositionSelect
                      value={position.name}
                      options={ONBOARDING_JOB_OPTIONS}
                      disabledOptions={selectedPositionNames.filter((name) => name !== position.name)}
                      onChange={(value) => handlePositionChange(position.id, "name", value)}
                    />
                  </Field>
                  <Field label="인원수" muted>
                    <Input
                      type="number"
                      min={1}
                      step={1}
                      value={position.recruitCount}
                      onChange={(event: ChangeEvent<HTMLInputElement>) =>
                        handlePositionChange(
                          position.id,
                          "recruitCount",
                          Number(event.target.value),
                        )
                      }
                      className="h-11 rounded-lg border-[#c3c6d7] bg-white text-base"
                    />
                  </Field>
                  <Field label="상세 설명" muted>
                    <Input
                      value={position.description}
                      onChange={(event: ChangeEvent<HTMLInputElement>) =>
                        handlePositionChange(position.id, "description", event.target.value)
                      }
                      placeholder="예) React 실무 경험 1년 이상 선호"
                      className="h-11 rounded-lg border-[#c3c6d7] bg-white text-base"
                    />
                  </Field>
                </div>
              </div>
            ))}
          </div>
        </FormSection>

        <div className="rounded-xl border border-[#c3c6d7] bg-white p-4 shadow-sm lg:hidden">
          <p className="mb-3 text-sm text-[#565e74]">
            완성도 {completion}% · 총 모집 인원 {totalRecruitCount}명
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => notify.info("임시 저장은 추후 연결 예정입니다.")}
              className="h-12 flex-1 rounded-lg border-[#c3c6d7] text-blue-500"
            >
              임시 저장
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="h-12 flex-1 rounded-lg bg-blue-400 text-white hover:bg-blue-500"
            >
              {mutation.isPending ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="size-4" aria-hidden="true" />
              )}
              {isEditMode ? "수정하기" : "생성하기"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

type CompletionCardProps = {
  completion: number
}

function CompletionCard({ completion }: CompletionCardProps) {
  return (
    <div className="rounded-xl border border-[#c3c6d7] bg-white p-6 shadow-sm">
      <div className="mb-2 flex items-end justify-between">
        <p className="text-base font-medium text-[#191c1e]">완성도</p>
        <p className="font-mono text-base font-medium text-blue-500">{completion}%</p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#e6e8ea]">
        <div className="h-full bg-blue-400" style={{ width: `${completion}%` }} />
      </div>
    </div>
  )
}

type ProgressNavProps = {
  activeSectionId: SectionId
  onSectionSelect: (sectionId: SectionId) => void
}

function ProgressNav({ activeSectionId, onSectionSelect }: ProgressNavProps) {
  return (
    <nav className="flex flex-col gap-2" aria-label="모임 작성 단계">
      {SECTION_NAV_ITEMS.map((item) => {
        const Icon = item.icon
        const isActive = activeSectionId === item.id

        return (
          <a
            key={item.id}
            href={`#${item.id}`}
            onClick={() => onSectionSelect(item.id)}
            aria-current={isActive ? "step" : undefined}
            className={cn(
              "flex items-center gap-4 rounded-lg py-4 pr-4 text-base transition-colors",
              isActive
                ? "border-l-[3px] border-blue-400 pl-[19px] font-medium text-[#191c1e]"
                : "pl-4 text-[#434655] hover:text-blue-500",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {item.label}
          </a>
        )
      })}
    </nav>
  )
}

type FormSectionProps = {
  id: string
  number: number
  title: string
  children: ReactNode
  action?: ReactNode
}

function FormSection({ id, number, title, children, action }: FormSectionProps) {
  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-xl border border-[#c3c6d7] bg-white p-6 shadow-sm"
    >
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-blue-50 text-base font-bold text-blue-500">
            {number}
          </span>
          <h2 className="text-base font-medium leading-6 text-[#191c1e]">{title}</h2>
        </div>
        {action}
      </div>
      <div className="space-y-6">{children}</div>
    </section>
  )
}

type FieldProps = {
  label: string
  children: ReactNode
  required?: boolean
  muted?: boolean
  className?: string
}

function Field({ label, children, required = false, muted = false, className }: FieldProps) {
  return (
    <label className={cn("flex flex-col gap-4", className)}>
      <span className={cn("text-base font-medium", muted ? "text-[#565e74]" : "text-[#191c1e]")}>
        {label}
        {required ? <span className="ml-1 text-blue-500">*</span> : null}
      </span>
      {children}
    </label>
  )
}

type PillControlProps = {
  value: string
  options: readonly { label: string; value: string }[]
  onChange: (value: string) => void
}

function PillControl({ value, options, onChange }: PillControlProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isActive = value === option.value

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-full px-6 py-2.5 text-base transition",
              isActive
                ? "border-2 border-blue-400 bg-blue-50 text-blue-500"
                : "border border-[#c3c6d7] bg-white text-[#565e74] hover:border-blue-400",
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

type PositionSelectProps = {
  value: string
  options: readonly string[]
  disabledOptions: string[]
  onChange: (value: string) => void
}

function PositionSelect({ value, options, disabledOptions, onChange }: PositionSelectProps) {
  const [open, setOpen] = useState(false)

  function handleSelect(option: string) {
    if (disabledOptions.includes(option)) {
      return
    }

    onChange(option)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-11 w-full items-center justify-between gap-2 rounded-lg border border-[#c3c6d7] bg-white px-4 text-left text-base outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20",
            value ? "text-[#191c1e]" : "text-[#737686]",
          )}
        >
          <span className="min-w-0 truncate">{value || "포지션을 선택해주세요"}</span>
          <ChevronDown className="size-4 shrink-0 text-[#565e74]" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-lg border-[#c3c6d7] bg-white p-1"
      >
        <div className="max-h-[440px] overflow-y-auto overscroll-contain">
          {options.map((option) => {
            const isSelected = value === option
            const isDisabled = disabledOptions.includes(option)

            return (
              <button
                key={option}
                type="button"
                onClick={() => handleSelect(option)}
                disabled={isDisabled}
                aria-disabled={isDisabled}
                className={cn(
                  "flex h-11 w-full items-center justify-between gap-3 rounded-md px-3 text-left text-sm transition",
                  isSelected
                    ? "bg-blue-50 font-medium text-blue-500"
                    : isDisabled
                      ? "cursor-not-allowed bg-[#f7f9fb] text-[#9ca3af]"
                    : "text-[#434655] hover:bg-[#f7f9fb] hover:text-[#191c1e]",
                )}
              >
                <span className="truncate">{option}</span>
                {isDisabled ? <span className="shrink-0 text-xs">이미 추가됨</span> : null}
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}

type TechStackOptionListProps = {
  inputValue: string
  options: readonly string[]
  selectedOptions: string[]
  onInputChange: (value: string) => void
  onInputKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void
  onToggle: (option: string) => void
}

function TechStackPicker({
  inputValue,
  options,
  selectedOptions,
  onInputChange,
  onInputKeyDown,
  onToggle,
}: TechStackOptionListProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Input
            value={inputValue}
            onChange={(event: ChangeEvent<HTMLInputElement>) => onInputChange(event.target.value)}
            onFocus={() => setOpen(true)}
            onClick={() => setOpen(true)}
            onKeyDown={onInputKeyDown}
            placeholder="기술 스택 검색 (예: Node.js, Python)"
            className="h-14 rounded-lg border-[#c3c6d7] bg-white pr-11 text-base"
          />
          <ChevronDown
            className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-[#565e74]"
            aria-hidden="true"
          />
        </div>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-lg border-[#c3c6d7] bg-white p-1"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        {options.length === 0 ? (
          <div className="rounded-md px-4 py-6 text-center text-sm text-[#737686]">
            검색 결과가 없습니다.
          </div>
        ) : (
          <div className="max-h-[440px] overflow-y-auto overscroll-contain">
            {options.map((option) => {
              const isSelected = selectedOptions.includes(option)

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => onToggle(option)}
                  aria-pressed={isSelected}
                  className={cn(
                    "flex h-11 w-full items-center justify-between gap-3 rounded-md px-3 text-left text-sm transition",
                    isSelected
                      ? "bg-blue-50 font-medium text-blue-500"
                      : "text-[#434655] hover:bg-[#f7f9fb] hover:text-[#191c1e]",
                  )}
                >
                  <span className="truncate">{option}</span>
                  {isSelected ? <span className="shrink-0 text-xs">선택됨</span> : null}
                </button>
              )
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

type SelectFieldProps = {
  value: string
  options: readonly string[]
  onChange: (value: string) => void
}

function SelectField({ value, options, onChange }: SelectFieldProps) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-14 w-full rounded-lg border border-[#c3c6d7] bg-white px-4 text-base text-[#191c1e] outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
    >
      {options.map((option) => (
        <option key={option}>{option}</option>
      ))}
    </select>
  )
}

type GetPayloadOptions = {
  includePositionIds?: boolean
}

function getPayload(form: MeetingFormState, options: GetPayloadOptions = {}): MeetingUpsertPayload {
  return {
    title: form.title.trim(),
    category: form.category,
    description: form.description.trim(),
    additionalNotice: form.referenceNote.trim() || null,
    thumbnailUrl: form.thumbnailUrl.trim() || null,
    techStacks: form.techStacks,
    deadline: form.deadline,
    startDate: form.startDate,
    expectedDuration: form.expectedDuration.trim(),
    meetingSchedule: form.meetingSchedule.trim(),
    positions: form.positions.map((position) => {
      const payloadPosition = {
        name: position.name.trim(),
        recruitCount: position.recruitCount,
        description: position.description.trim() || null,
      }

      if (options.includePositionIds && typeof position.serverId === "number") {
        return { id: position.serverId, ...payloadPosition }
      }

      return payloadPosition
    }),
  }
}

function validatePayload(payload: MeetingUpsertPayload) {
  if (!payload.title) return "모임 제목을 입력해주세요."
  if (!payload.description) return "모임 소개를 입력해주세요."
  if (!payload.deadline) return "모집 마감일을 선택해주세요."
  if (!payload.startDate) return "시작 예정일을 선택해주세요."
  if (!payload.expectedDuration) return "예상 기간을 입력해주세요."
  if (!payload.meetingSchedule) return "회의 일정을 입력해주세요."
  if (payload.techStacks.length === 0) return "기술 스택을 1개 이상 선택해주세요."
  if (payload.positions.length === 0) return "모집 포지션을 1개 이상 추가해주세요."
  if (payload.positions.some((position) => !position.name)) {
    return "포지션명을 선택해주세요."
  }
  if (hasDuplicatePositionNames(payload.positions.map((position) => position.name))) {
    return "이미 선택한 포지션은 중복으로 추가할 수 없습니다."
  }
  if (payload.positions.some((position) => !isValidRecruitCount(position.recruitCount))) {
    return "포지션별 모집 인원은 1명 이상의 정수여야 합니다."
  }

  return null
}

function hasDuplicatePositionNames(names: string[]) {
  return new Set(names).size !== names.length
}

function getCompletion(form: MeetingFormState) {
  const checks = [
    form.category,
    form.thumbnailUrl,
    form.title,
    form.deadline,
    form.description,
    form.techStacks.length > 0,
    form.referenceNote,
    form.startDate,
    form.expectedDuration,
    form.meetingSchedule,
    form.positions.length > 0,
    form.positions.every(
      (position) => position.name && isValidRecruitCount(position.recruitCount),
    ),
  ]

  const completedCount = checks.filter(Boolean).length

  return Math.round((completedCount / checks.length) * 100)
}

function isValidRecruitCount(value: number) {
  return Number.isFinite(value) && Number.isInteger(value) && value >= 1
}

function mapMeetingDetailToForm(meeting: MeetingDetail): MeetingFormState {
  const positions = normalizeMeetingPositions(meeting.positions)

  return {
    title: meeting.title ?? "",
    category: meeting.category ?? "PROJECT",
    thumbnailUrl: meeting.thumbnailUrl ?? "",
    deadline: getDateInputValue(meeting.deadline),
    startDate: getDateInputValue(meeting.startDate),
    expectedDuration: meeting.expectedDuration ?? meeting.duration ?? "1개월 미만",
    meetingSchedule: meeting.meetingSchedule ?? meeting.meetingType ?? "주 1회",
    description: meeting.description ?? meeting.introduction ?? meeting.content ?? "",
    techStackInput: "",
    techStacks: meeting.techStacks ?? [],
    referenceNote: meeting.additionalNotice ?? "",
    positions:
      positions.length > 0
        ? positions.map((position) => ({
            id: `position-${position.id}`,
            serverId: position.id,
            name: position.name,
            recruitCount: position.recruitCount,
            description: position.description ?? "",
          }))
        : INITIAL_FORM.positions,
  }
}

function getDateInputValue(value?: string | null) {
  if (!value) {
    return ""
  }

  return value.slice(0, 10)
}

function getStableId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}
