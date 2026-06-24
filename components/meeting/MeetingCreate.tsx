"use client"

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { z } from "zod"
import {
  CalendarDays,
  ChevronDown,
  FileText,
  ImagePlus,
  Info,
  LoaderCircle,
  Plus,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react"

import { Calendars } from "@/components/common/Calendars"
import MeetingCard, { type Meeting as MeetingCardPreview } from "@/components/common/MeetingCard"
import { MeetingFormSkeleton } from "@/components/meeting/MeetingSkeletons"
import { Button } from "@/components/ui/button"
import { TechStackBadge } from "@/components/ui/badge"
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
import { uploadImage } from "@/lib/api/uploads"
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

type FieldErrors = Record<string, string>

const FORM_ID = "meeting-upsert-form"
const SECTION_NAV_ITEMS = [
  { id: "basic-info", label: "기본 정보", icon: Info },
  { id: "introduction", label: "모집 소개", icon: FileText },
  { id: "schedule", label: "진행 방식", icon: CalendarDays },
  { id: "positions", label: "모집 포지션", icon: Users },
] as const
const SECTION_SCROLL_OFFSET = 160

type SectionId = (typeof SECTION_NAV_ITEMS)[number]["id"]

const INITIAL_FORM: MeetingFormState = {
  title: "",
  category: "",
  thumbnailUrl: "",
  deadline: "",
  startDate: "",
  expectedDuration: "",
  meetingSchedule: "",
  description: "",
  techStackInput: "",
  techStacks: [],
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
const IMAGE_ACCEPT_TYPES = ["image/jpeg", "image/png", "image/webp"] as const
const IMAGE_MAX_SIZE = 5 * 1024 * 1024
const MEETING_TITLE_MAX_LENGTH = 40
const MEETING_DESCRIPTION_MAX_LENGTH = 1000
const MEETING_REFERENCE_NOTE_MAX_LENGTH = 150
const MEETING_TECH_STACK_MAX_COUNT = 10
const MEETING_POSITION_MAX_COUNT = 5
const POSITION_DESCRIPTION_MAX_LENGTH = 150

const meetingPayloadSchema = z.object({
  title: z
    .string()
    .min(1, "모임 제목을 입력해주세요.")
    .max(MEETING_TITLE_MAX_LENGTH, `모임 제목은 ${MEETING_TITLE_MAX_LENGTH}자 이하여야 합니다.`),
  category: z.string().min(1, "모임 카테고리를 선택해주세요."),
  description: z
    .string()
    .min(1, "모임 소개를 입력해주세요.")
    .max(
      MEETING_DESCRIPTION_MAX_LENGTH,
      `모임 목표 및 소개는 ${MEETING_DESCRIPTION_MAX_LENGTH}자 이하여야 합니다.`,
    ),
  additionalNotice: z
    .string()
    .max(
      MEETING_REFERENCE_NOTE_MAX_LENGTH,
      `기타 참고 사항은 ${MEETING_REFERENCE_NOTE_MAX_LENGTH}자 이하여야 합니다.`,
    )
    .nullable()
    .optional(),
  thumbnailUrl: z.string().nullable().optional(),
  techStacks: z
    .array(z.string())
    .min(1, "기술 스택을 1개 이상 선택해주세요.")
    .max(
      MEETING_TECH_STACK_MAX_COUNT,
      `기술 스택은 ${MEETING_TECH_STACK_MAX_COUNT}개까지 선택할 수 있습니다.`,
    ),
  deadline: z.string().min(1, "모집 마감일을 선택해주세요."),
  startDate: z.string().min(1, "시작 예정일을 선택해주세요."),
  expectedDuration: z.string().min(1, "예상 기간을 입력해주세요."),
  meetingSchedule: z.string().min(1, "회의 일정을 입력해주세요."),
  positions: z
    .array(
      z.object({
        id: z.number().optional(),
        name: z.string().min(1, "포지션명을 선택해주세요."),
        recruitCount: z
          .number()
          .int("포지션별 모집 인원은 1명 이상의 정수여야 합니다.")
          .min(1, "포지션별 모집 인원은 1명 이상의 정수여야 합니다."),
        description: z
          .string()
          .max(
            POSITION_DESCRIPTION_MAX_LENGTH,
            `포지션 설명은 ${POSITION_DESCRIPTION_MAX_LENGTH}자 이하여야 합니다.`,
          )
          .nullable()
          .optional(),
      }),
    )
    .min(1, "모집 포지션을 1개 이상 추가해주세요.")
    .max(
      MEETING_POSITION_MAX_COUNT,
      `모집 포지션은 ${MEETING_POSITION_MAX_COUNT}개까지 추가할 수 있습니다.`,
    ),
    }).superRefine((payload, context) => {
  const deadline = parseDateValue(payload.deadline)
  const startDate = parseDateValue(payload.startDate)

  if (deadline && startDate && deadline > startDate) {
    context.addIssue({
      code: "custom",
      path: ["deadline"],
      message: "모집 마감일은 시작 예정일 이전이어야 합니다.",
    })
  }
})

export function MeetingCreate({ meetingId }: MeetingCreateProps) {
  const isEditMode = typeof meetingId === "number" && Number.isFinite(meetingId)
  const detailQuery = useQuery({
    queryKey: isEditMode ? queryKeys.meetings.detail(meetingId) : ["meetings", "create"],
    queryFn: () => fetchMeetingDetail(meetingId as number),
    enabled: isEditMode,
  })

  if (detailQuery.isLoading) {
    return <MeetingFormSkeleton />
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
  const thumbnailInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState<MeetingFormState>(initialForm)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [activeSectionId, setActiveSectionId] = useState<SectionId>("basic-info")
  const [thumbnailUploading, setThumbnailUploading] = useState(false)

  const completion = useMemo(() => getCompletion(form), [form])
  const selectedPositionNames = useMemo(
    () => form.positions.map((position) => position.name).filter(Boolean),
    [form.positions],
  )
  const canAddPosition =
    form.positions.length < Math.min(ONBOARDING_JOB_OPTIONS.length, MEETING_POSITION_MAX_COUNT)
  const filteredTechStackOptions = useMemo(() => {
    const query = form.techStackInput.trim().toLowerCase()
    const list = query
      ? ONBOARDING_TECH_STACK_OPTIONS.filter((stack) => stack.toLowerCase().includes(query))
      : ONBOARDING_TECH_STACK_OPTIONS
    // A-Z 정렬(대소문자 무시) — 목록에서 원하는 스택을 찾기 쉽게.
    return [...list].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" }),
    )
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
  const isSubmitting = mutation.isPending || thumbnailUploading

  useEffect(() => {
    const sections = SECTION_NAV_ITEMS.map((item) => document.getElementById(item.id)).filter(
      (section): section is HTMLElement => section !== null,
    )

    if (sections.length === 0) {
      return
    }

    function updateActiveSection() {
      // 페이지 맨 아래에선 마지막 섹션의 top이 활성 기준선(SECTION_SCROLL_OFFSET)까지
      // 올라오지 못해 활성이 안 잡힌다 → 바닥에 닿으면 마지막 섹션을 강제 활성.
      const scrolledToBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2

      if (scrolledToBottom) {
        const lastId = sections[sections.length - 1].id as SectionId
        setActiveSectionId((prev) => (prev === lastId ? prev : lastId))
        return
      }

      const currentSection = sections.reduce<HTMLElement | null>((current, section) => {
        const sectionTop = section.getBoundingClientRect().top

        if (sectionTop <= SECTION_SCROLL_OFFSET) {
          return section
        }

        return current
      }, sections[0])

      if (!currentSection) {
        return
      }

      const nextSectionId = currentSection.id as SectionId

      setActiveSectionId((prev) => (prev === nextSectionId ? prev : nextSectionId))
    }

    updateActiveSection()
    window.addEventListener("scroll", updateActiveSection, { passive: true })
    window.addEventListener("resize", updateActiveSection)

    return () => {
      window.removeEventListener("scroll", updateActiveSection)
      window.removeEventListener("resize", updateActiveSection)
    }
  }, [])

  function updateField<K extends keyof MeetingFormState>(key: K, value: MeetingFormState[K]) {
    clearFieldError(getFormFieldValidationPath(key))
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function clearFieldError(path: string) {
    setFieldErrors((prev) => {
      if (!prev[path]) {
        return prev
      }

      const next = { ...prev }
      delete next[path]
      return next
    })
  }

  function handleAddTechStack(stack: string) {
    const nextStack = stack.trim()
    const matchedStack = ONBOARDING_TECH_STACK_OPTIONS.find(
      (option) => option.toLowerCase() === nextStack.toLowerCase(),
    )

    if (!nextStack) {
      return
    }

    if (!matchedStack) {
      notify.warning("검색 결과에 있는 기술 스택만 추가할 수 있습니다.")
      return
    }

    if (form.techStacks.includes(matchedStack)) {
      return
    }

    if (form.techStacks.length >= MEETING_TECH_STACK_MAX_COUNT) {
      notify.warning(`기술 스택은 ${MEETING_TECH_STACK_MAX_COUNT}개까지 선택할 수 있습니다.`)
      return
    }

    updateField("techStacks", [...form.techStacks, matchedStack])
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

  async function handleThumbnailFile(file: File) {
    if (thumbnailUploading) {
      return
    }

    if (!validateImageFile(file)) {
      return
    }

    setThumbnailUploading(true)

    try {
      const imageUrl = await uploadImage(file)

      updateField("thumbnailUrl", imageUrl)
      notify.success("커버 이미지가 업로드되었습니다.")
    } catch (error) {
      notify.error(error instanceof Error ? error.message : "이미지 업로드에 실패했습니다.")
    } finally {
      setThumbnailUploading(false)
    }
  }

  function handleThumbnailInputChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ""

    if (!file) {
      return
    }

    void handleThumbnailFile(file)
  }

  function handleThumbnailDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()

    const file = event.dataTransfer.files[0]

    if (!file) {
      return
    }

    void handleThumbnailFile(file)
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
      notify.warning("이미 선택한 포지션입니다.")
      return
    }

    if (key === "recruitCount" && !isValidRecruitCount(value as number)) {
      notify.warning("포지션별 모집 인원은 1명 이상의 정수여야 합니다.")
      return
    }

    const positionIndex = form.positions.findIndex((position) => position.id === positionId)
    if (positionIndex >= 0) {
      clearFieldError(getPositionFieldPath(positionIndex, key))
    }

    setForm((prev) => ({
      ...prev,
      positions: prev.positions.map((position) =>
        position.id === positionId ? { ...position, [key]: value } : position,
      ),
    }))
  }

  function handleAddPosition() {
    if (!canAddPosition) {
      notify.warning(`모집 포지션은 ${MEETING_POSITION_MAX_COUNT}개까지 추가할 수 있습니다.`)
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
      notify.warning("모집 포지션은 최소 1개 이상 필요합니다.")
      return
    }

    updateField(
      "positions",
      form.positions.filter((position) => position.id !== positionId),
    )
  }

  function handleSectionSelect(sectionId: SectionId) {
    setActiveSectionId(sectionId)

    const section = document.getElementById(sectionId)

    if (!section) {
      return
    }

    const sectionTop = section.getBoundingClientRect().top + window.scrollY

    window.scrollTo({
      top: sectionTop - SECTION_SCROLL_OFFSET,
      behavior: "smooth",
    })
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isSubmitting) {
      notify.warning(
        thumbnailUploading
          ? "이미지 업로드가 완료된 뒤 저장해주세요."
          : "모임 저장이 완료된 뒤 다시 시도해주세요.",
      )
      return
    }

    const payload = getPayload(form, {
      includePositionIds: isEditMode,
      clearEmptyThumbnail: isEditMode,
    })
    const error = validatePayload(payload)

    if (error) {
      setFieldErrors(error.fieldErrors)
      notify.warning(error.message)
      focusField(error.path)
      return
    }

    setFieldErrors({})
    mutation.mutate(payload)
  }

  return (
    <div className="flex gap-6 px-0 py-0 lg:items-start lg:gap-10 xl:gap-12">
      <aside className="hidden w-[256px] shrink-0 lg:sticky lg:top-24 lg:self-start lg:block">
        <div className="w-full space-y-4">
          <FormStatusBar
            activeSectionId={activeSectionId}
            completion={completion}
            isEditMode={isEditMode}
            isSubmitting={isSubmitting}
            onSectionSelect={handleSectionSelect}
            variant="sidebar"
          />
          <CoverImageCardPreview
            category={form.category}
            deadline={form.deadline}
            imageUrl={form.thumbnailUrl}
            positions={form.positions}
            techStacks={form.techStacks}
            title={form.title}
          />
        </div>
      </aside>

      <form
        id={FORM_ID}
        onSubmit={handleSubmit}
        className="min-w-0 flex-1 space-y-10 pb-80 lg:pb-[30rem]"
      >
        <div className="lg:hidden">
          <FormStatusBar
            activeSectionId={activeSectionId}
            completion={completion}
            isEditMode={isEditMode}
            isSubmitting={isSubmitting}
            onSectionSelect={handleSectionSelect}
            variant="top"
          />
        </div>

        <FormSection id="basic-info" title="기본 정보">
          <Field label="모임 카테고리" required>
            <PillControl
              value={form.category}
              options={MEETING_CATEGORY_OPTIONS}
              onChange={(value) => updateField("category", value)}
              error={fieldErrors.category}
            />
          </Field>

          <Field label="커버 이미지">
            <div
              className="rounded-xl border border-[#c3c6d7] bg-[#f7f9fb] p-3"
            >
              <input
                ref={thumbnailInputRef}
                type="file"
                accept={IMAGE_ACCEPT_TYPES.join(",")}
                onChange={handleThumbnailInputChange}
                className="hidden"
              />
              <div
                onDrop={handleThumbnailDrop}
                onDragOver={(event) => event.preventDefault()}
                className={cn(
                  "relative flex min-h-24 flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#c3c6d7] bg-white px-4 py-3 text-center transition",
                  thumbnailUploading ? "opacity-80" : "hover:border-blue-400 hover:bg-blue-50",
                )}
              >
                {form.thumbnailUrl ? (
                  <button
                    type="button"
                    onClick={() => updateField("thumbnailUrl", "")}
                    aria-label="커버 이미지 삭제"
                    title="커버 이미지 삭제"
                    className="absolute right-2 top-2 inline-flex size-7 cursor-pointer items-center justify-center rounded-full bg-[#f7f9fb] text-[#565e74] transition hover:bg-white hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/20"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                ) : null}
                {thumbnailUploading ? (
                  <LoaderCircle className="mb-1.5 size-5 animate-spin text-blue-400" aria-hidden="true" />
                ) : (
                  <ImagePlus className="mb-1.5 size-6 text-[#737686]" aria-hidden="true" />
                )}
                <span className="text-sm text-[#565e74]">
                  이미지를 드래그하여 업로드하세요
                </span>
                <span className="mt-1 text-xs text-[#737686]">
                  정사각형 이미지 권장, 최대 5MB
                </span>
                <span className="mt-1 text-xs text-[#737686]">
                  이미지를 추가하지 않으면 선택한 카테고리의 기본 이미지가 사용됩니다.
                </span>
                {form.thumbnailUrl ? (
                  <span className="mt-1 text-xs font-medium text-blue-500">
                    이미지가 추가되었습니다.
                  </span>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => thumbnailInputRef.current?.click()}
                  disabled={isSubmitting}
                  className="mt-2 h-9 cursor-pointer rounded-lg border-[#c3c6d7] bg-white text-blue-500 focus-visible:border-blue-400 focus-visible:ring-blue-400/20 disabled:cursor-default"
                >
                  {thumbnailUploading ? (
                    <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Upload className="size-4" aria-hidden="true" />
                  )}
                  {thumbnailUploading ? "업로드 중" : form.thumbnailUrl ? "이미지 변경" : "이미지 추가"}
                </Button>
              </div>
            </div>
          </Field>

          <div className="grid gap-6 md:grid-cols-2">
            <Field label="모임 제목" required className="md:col-span-2">
              <TextInputWithCount
                value={form.title}
                maxLength={MEETING_TITLE_MAX_LENGTH}
                onChange={(value) => updateField("title", value)}
                placeholder="예) 러스트로 만드는 실시간 채팅 서버 프로젝트"
                className="h-16"
                fieldPath="title"
                error={fieldErrors.title}
              />
            </Field>
            <Field label="모집 마감일" required>
              <DatePickerField
                value={form.deadline}
                onChange={(value) => updateField("deadline", value)}
                placeholder="모집 마감일 선택"
                className="h-16"
                fieldPath="deadline"
                error={fieldErrors.deadline}
              />
            </Field>
          </div>
        </FormSection>

        <FormSection id="introduction" title="모집 소개">
          <Field label="모임 목표 및 소개" required>
            <TextareaWithCount
              value={form.description}
              maxLength={MEETING_DESCRIPTION_MAX_LENGTH}
              onChange={(value) => updateField("description", value)}
              placeholder="모임의 목적, 진행 방식, 결과물 등에 대해 상세히 적어주세요."
              fieldPath="description"
              error={fieldErrors.description}
            />
          </Field>

          <Field label="사용 기술 스택" required asGroup hint={`최대 ${MEETING_TECH_STACK_MAX_COUNT}개까지 선택 가능합니다.`}>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {form.techStacks.map((stack) => (
                  <TechStackBadge
                    key={stack}
                    onRemove={() => handleRemoveTechStack(stack)}
                    removeLabel={`${stack} 삭제`}
                  >
                    {stack}
                  </TechStackBadge>
                ))}
              </div>
              <TechStackPicker
                inputValue={form.techStackInput}
                options={filteredTechStackOptions}
                selectedOptions={form.techStacks}
                onInputChange={(value) => updateField("techStackInput", value)}
                onInputKeyDown={handleTechStackKeyDown}
                error={fieldErrors.techStacks}
                onToggle={(stack) =>
                  form.techStacks.includes(stack)
                    ? handleRemoveTechStack(stack)
                    : handleAddTechStack(stack)
                }
              />
            </div>
          </Field>

          <Field label="기타 참고 사항">
            <TextareaWithCount
              value={form.referenceNote}
              maxLength={MEETING_REFERENCE_NOTE_MAX_LENGTH}
              onChange={(value) => updateField("referenceNote", value)}
              placeholder="사전 과제, 참고 링크 등이 있다면 입력해주세요."
              className="min-h-28"
              fieldPath="additionalNotice"
              error={fieldErrors.additionalNotice}
            />
          </Field>
        </FormSection>

        <FormSection id="schedule" title="진행 정보">
          <div className="grid gap-6 md:grid-cols-3">
            <Field label="시작 예정일" required>
              <DatePickerField
                value={form.startDate}
                onChange={(value) => updateField("startDate", value)}
                placeholder="시작 예정일 선택"
                fieldPath="startDate"
                error={fieldErrors.startDate}
              />
            </Field>
            <Field label="예상 기간" required>
              <SelectField
                value={form.expectedDuration}
                options={DURATION_OPTIONS}
                placeholder="예상 기간 선택"
                onChange={(value) => updateField("expectedDuration", value)}
                fieldPath="expectedDuration"
                error={fieldErrors.expectedDuration}
              />
            </Field>
            <Field label="회의 일정" required>
              <SelectField
                value={form.meetingSchedule}
                options={SCHEDULE_OPTIONS}
                placeholder="회의 일정 선택"
                onChange={(value) => updateField("meetingSchedule", value)}
                fieldPath="meetingSchedule"
                error={fieldErrors.meetingSchedule}
              />
            </Field>
          </div>
        </FormSection>

        <FormSection
          id="positions"
          title="모집 포지션"
          hint={`최대 ${MEETING_POSITION_MAX_COUNT}개까지 선택 가능합니다.`}
          action={
            <Button
              type="button"
              variant="outline"
              onClick={handleAddPosition}
              disabled={!canAddPosition}
              className={cn(
                "h-9 rounded-lg border-[#c3c6d7] bg-white px-3 text-sm font-medium text-blue-500 hover:bg-blue-50 hover:text-blue-500 focus-visible:border-blue-400 focus-visible:ring-blue-400/20",
                "cursor-pointer",
                !canAddPosition && "cursor-default border-[#d9dce6] text-[#9ca3af] hover:bg-white hover:text-[#9ca3af]",
              )}
            >
              <Plus className="size-4" aria-hidden="true" />
              포지션 추가
            </Button>
          }
        >
          <div className="space-y-6">
            {form.positions.map((position, index) => (
              <div
                key={position.id}
                className="relative rounded-xl border border-[#c3c6d7] bg-[#f7f9fb] p-6"
              >
                <button
                  type="button"
                  onClick={() => handleRemovePosition(position.id)}
                  aria-label="포지션 삭제"
                  title="포지션 삭제"
                  className="absolute right-4 top-4 cursor-pointer text-[#565e74] transition hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/20"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
                <div className="grid gap-5 md:grid-cols-[minmax(190px,1.15fr)_76px_minmax(0,2.45fr)]">
                  <Field label="포지션명" muted required>
                    <PositionSelect
                      value={position.name}
                      options={ONBOARDING_JOB_OPTIONS}
                      disabledOptions={selectedPositionNames.filter((name) => name !== position.name)}
                      onChange={(value) => handlePositionChange(position.id, "name", value)}
                      fieldPath={getPositionFieldPath(index, "name")}
                      error={fieldErrors[getPositionFieldPath(index, "name")]}
                    />
                  </Field>
                  <Field label="인원수" muted required>
                    <div className="space-y-1.5">
                      <Input
                        type="number"
                        min={1}
                        step={1}
                        value={position.recruitCount}
                        data-field={getPositionFieldPath(index, "recruitCount")}
                        onChange={(event: ChangeEvent<HTMLInputElement>) =>
                          handlePositionChange(
                            position.id,
                            "recruitCount",
                            Number(event.target.value),
                          )
                        }
                        className={cn(
                          "h-11 rounded-lg border-[#c3c6d7] bg-white text-base focus:border-blue-400 focus:ring-blue-400/20 focus-visible:border-blue-400 focus-visible:ring-blue-400/20",
                          fieldErrors[getPositionFieldPath(index, "recruitCount")] &&
                            "border-red-400 focus-visible:ring-red-200",
                        )}
                      />
                      <FieldErrorMessage
                        message={fieldErrors[getPositionFieldPath(index, "recruitCount")]}
                      />
                    </div>
                  </Field>
                  <Field label="상세 설명" muted>
                    <TextInputWithCount
                      value={position.description}
                      maxLength={POSITION_DESCRIPTION_MAX_LENGTH}
                      onChange={(value) =>
                        handlePositionChange(position.id, "description", value)
                      }
                      placeholder="예) React 실무 경험 1년 이상 선호"
                      className="h-11"
                      fieldPath={getPositionFieldPath(index, "description")}
                      error={fieldErrors[getPositionFieldPath(index, "description")]}
                    />
                  </Field>
                </div>
              </div>
            ))}
          </div>
        </FormSection>
      </form>
    </div>
  )
}

type FormStatusBarProps = {
  activeSectionId: SectionId
  completion: number
  isEditMode: boolean
  isSubmitting: boolean
  onSectionSelect: (sectionId: SectionId) => void
  variant?: "sidebar" | "top"
}

function FormStatusBar({
  activeSectionId,
  completion,
  isEditMode,
  isSubmitting,
  onSectionSelect,
  variant = "sidebar",
}: FormStatusBarProps) {
  const isTopVariant = variant === "top"

  return (
    <div
      className={cn(
        "w-full rounded-xl border border-[#c3c6d7] bg-white shadow-sm",
        isTopVariant ? "p-3 sm:p-4" : "p-2.5",
      )}
    >
      <div
        className={cn(
          isTopVariant
            ? "grid gap-3 sm:grid-cols-[minmax(160px,1fr)_auto_minmax(140px,180px)] sm:items-center"
            : "space-y-2",
        )}
      >
        <div className={cn(isTopVariant && "min-w-0")}>
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "shrink-0 font-semibold text-[#191c1e]",
                isTopVariant ? "text-base" : "text-xs",
              )}
            >
              완성도
            </span>
            <div
              className={cn(
                "min-w-0 flex-1 overflow-hidden rounded-full bg-[#e6e8ea]",
                isTopVariant ? "h-2.5" : "h-2",
              )}
            >
              <div className="h-full bg-blue-400" style={{ width: `${completion}%` }} />
            </div>
            <span
              className={cn(
                "shrink-0 font-mono font-semibold text-blue-500",
                isTopVariant ? "text-base" : "text-xs",
              )}
            >
              {completion}%
            </span>
          </div>
        </div>
        <HorizontalProgressNav
          activeSectionId={activeSectionId}
          onSectionSelect={onSectionSelect}
        />
        <Button
          type="submit"
          form={FORM_ID}
          disabled={isSubmitting}
          className={cn(
            "w-full rounded-lg bg-blue-400 px-4 font-semibold text-white hover:bg-blue-500",
            isTopVariant ? "h-11 text-base sm:h-12" : "h-10 text-sm xl:h-11",
          )}
        >
          {isEditMode ? "모임 수정하기" : "모임 생성하기"}
        </Button>
      </div>
    </div>
  )
}

type HorizontalProgressNavProps = {
  activeSectionId: SectionId
  onSectionSelect: (sectionId: SectionId) => void
}

function HorizontalProgressNav({ activeSectionId, onSectionSelect }: HorizontalProgressNavProps) {
  return (
    <nav
      className="flex min-w-0 justify-center gap-0.5 overflow-hidden"
      aria-label="모임 작성 단계"
    >
      {SECTION_NAV_ITEMS.map((item) => {
        const Icon = item.icon
        const isActive = activeSectionId === item.id

        return (
          <a
            key={item.id}
            href={`#${item.id}`}
            onClick={(event) => {
              event.preventDefault()
              onSectionSelect(item.id)
            }}
            aria-current={isActive ? "step" : undefined}
            aria-label={item.label}
            title={item.label}
            className={cn(
              "flex h-10 min-w-10 shrink cursor-pointer items-center justify-center rounded-lg px-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/20",
              isActive ? "text-blue-500" : "text-[#565e74] hover:bg-[#f7f9fb] hover:text-blue-500",
            )}
          >
            <span
              className={cn(
                "flex size-8 items-center justify-center rounded-full transition-colors",
                isActive ? "bg-blue-100 text-blue-500" : "text-[#565e74]",
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
            </span>
          </a>
        )
      })}
    </nav>
  )
}

type CoverImageCardPreviewProps = {
  category: string
  deadline: string
  imageUrl: string
  positions: PositionForm[]
  title: string
  techStacks: string[]
}

function CoverImageCardPreview({
  category,
  deadline,
  imageUrl,
  positions,
  title,
  techStacks,
}: CoverImageCardPreviewProps) {
  const categoryLabel =
    MEETING_CATEGORY_OPTIONS.find((option) => option.value === category)?.label ?? "프로젝트"
  const previewTitle = title.trim() || "모임 제목이 여기에 표시됩니다"
  const maxMembers = positions.reduce((total, position) => total + position.recruitCount, 0)
  const previewMeeting: MeetingCardPreview = {
    id: "preview",
    title: previewTitle,
    date: formatDisplayDate(deadline),
    deadline: formatDisplayDate(deadline),
    deadlineDate: deadline,
    status: "모집중",
    category: categoryLabel,
    memberCount: 0,
    maxMembers,
    techStacks,
    jobs: positions
      .filter((position) => position.name)
      .map((position) => ({
        job: position.name,
        current: 0,
        max: position.recruitCount,
      })),
    imageCategory: category,
    imageUrl,
    isBookmarked: false,
    isClosingToday: false,
  }

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-[#565e74]">모임 카드 미리보기</p>
      <div className="w-full overflow-hidden rounded-lg">
        <MeetingCard
          meeting={previewMeeting}
          disableLink
          showCategoryBadge={Boolean(category)}
          showBookmark={false}
          showEmptyPreviewHints
        />
      </div>
    </div>
  )
}

type FormSectionProps = {
  id: SectionId
  title: string
  children: ReactNode
  action?: ReactNode
  hint?: string
}

function FormSection({ id, title, children, action, hint }: FormSectionProps) {
  const Icon = SECTION_NAV_ITEMS.find((item) => item.id === id)?.icon ?? Info

  return (
    <section
      id={id}
      className="scroll-mt-40 rounded-xl border border-[#c3c6d7] bg-white p-6 shadow-sm"
    >
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-blue-50 text-blue-500">
            <Icon className="size-4" aria-hidden="true" />
          </span>
          <h2 className="text-base font-bold leading-6 text-[#191c1e]">{title}</h2>
          {hint ? <span className="text-sm font-normal text-[#9ca3af]">({hint})</span> : null}
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
  hint?: string
  // 칩 등 인터랙티브 요소가 여러 개인 필드는 label로 감싸면 빈 곳 클릭이
  // 첫 번째 컨트롤(맨 앞 칩의 삭제 버튼)로 전달돼 칩이 지워진다. div로 렌더해 회피.
  asGroup?: boolean
}

function Field({
  label,
  children,
  required = false,
  muted = false,
  className,
  hint,
  asGroup = false,
}: FieldProps) {
  const Wrapper = asGroup ? "div" : "label"
  return (
    <Wrapper
      className={cn("flex flex-col gap-4", className)}
      {...(asGroup ? { role: "group", "aria-label": label } : {})}
    >
      <span className={cn("text-base font-medium", muted ? "text-[#565e74]" : "text-[#191c1e]")}>
        {label}
        {required ? <span className="ml-1 text-blue-500">*</span> : null}
        {hint ? <span className="ml-2 text-sm font-normal text-[#9ca3af]">({hint})</span> : null}
      </span>
      {children}
    </Wrapper>
  )
}

type TextInputWithCountProps = {
  value: string
  maxLength: number
  onChange: (value: string) => void
  placeholder: string
  className?: string
  fieldPath?: string
  error?: string
}

function TextInputWithCount({
  value,
  maxLength,
  onChange,
  placeholder,
  className,
  fieldPath,
  error,
}: TextInputWithCountProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Input
        value={value}
        maxLength={maxLength}
        data-field={fieldPath}
        // 네이티브 maxLength는 한글 IME 조합 입력에서 한 글자 초과될 수 있어 slice로 한 번 더 막는다.
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          onChange(event.target.value.slice(0, maxLength))
        }
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        className={cn(
          "rounded-lg border-[#c3c6d7] bg-white text-base focus:border-blue-400 focus:ring-blue-400/20 focus-visible:border-blue-400 focus-visible:ring-blue-400/20",
          error && "border-red-400 focus-visible:ring-red-200",
          className,
        )}
      />
      <FieldFeedback error={error} current={value.length} max={maxLength} />
    </div>
  )
}

type TextareaWithCountProps = {
  value: string
  maxLength: number
  onChange: (value: string) => void
  placeholder: string
  className?: string
  fieldPath?: string
  error?: string
}

function TextareaWithCount({
  value,
  maxLength,
  onChange,
  placeholder,
  className,
  fieldPath,
  error,
}: TextareaWithCountProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <textarea
        value={value}
        maxLength={maxLength}
        data-field={fieldPath}
        // 네이티브 maxLength는 한글 IME 조합 입력에서 한 글자 초과될 수 있어 slice로 한 번 더 막는다.
        onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
          onChange(event.target.value.slice(0, maxLength))
        }
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        className={cn(
          "min-h-52 w-full rounded-lg border border-[#c3c6d7] bg-white px-4 py-4 text-base text-[#191c1e] outline-none transition placeholder:text-[#6b7280] focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20",
          error && "border-red-400 focus:border-red-400 focus:ring-red-200",
          className,
        )}
      />
      <FieldFeedback error={error} current={value.length} max={maxLength} />
    </div>
  )
}

type FieldFeedbackProps = {
  error?: string
  current?: number
  max?: number
}

function FieldFeedback({ error, current, max }: FieldFeedbackProps) {
  if (!error && (current === undefined || max === undefined)) {
    return null
  }

  return (
    <div className="flex items-start justify-between gap-3">
      <FieldErrorMessage message={error} />
      {current !== undefined && max !== undefined ? (
        <span className="ml-auto shrink-0 text-xs font-medium text-[#737686]">
          {current}/{max}
        </span>
      ) : null}
    </div>
  )
}

type FieldErrorMessageProps = {
  message?: string
}

function FieldErrorMessage({ message }: FieldErrorMessageProps) {
  if (!message) {
    return null
  }

  return (
    <span className="text-xs font-medium text-red-500">
      {message}
    </span>
  )
}

type PillControlProps = {
  value: string
  options: readonly { label: string; value: string }[]
  onChange: (value: string) => void
  error?: string
}

function PillControl({ value, options, onChange, error }: PillControlProps) {
  return (
    <div className="space-y-1.5" data-field="category">
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isActive = value === option.value

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={cn(
                "cursor-pointer rounded-full px-6 py-2.5 text-base transition",
                isActive
                  ? "border-2 border-blue-400 bg-blue-50 text-blue-500"
                  : "border border-[#c3c6d7] bg-white text-[#565e74] hover:border-blue-400 focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-400/20",
                error && !isActive && "border-red-400",
              )}
            >
              {option.label}
            </button>
          )
        })}
      </div>
      <FieldErrorMessage message={error} />
    </div>
  )
}

type PositionSelectProps = {
  value: string
  options: readonly string[]
  disabledOptions: string[]
  onChange: (value: string) => void
  fieldPath?: string
  error?: string
}

type DatePickerFieldProps = {
  value: string
  onChange: (value: string) => void
  placeholder: string
  className?: string
  fieldPath?: string
  error?: string
}

function DatePickerField({
  value,
  onChange,
  placeholder,
  className,
  fieldPath,
  error,
}: DatePickerFieldProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-1.5">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            data-field={fieldPath}
            className={cn(
              "flex h-14 w-full cursor-pointer items-center gap-3 rounded-lg border border-[#c3c6d7] bg-white px-4 text-left text-base outline-none transition hover:border-blue-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-400/20",
              value ? "text-[#191c1e]" : "text-[#737686]",
              error && "border-red-400 focus:border-red-400 focus:ring-red-200",
              className,
            )}
          >
            <CalendarDays className="size-4 shrink-0 text-[#565e74]" aria-hidden="true" />
            <span>{value || placeholder}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendars
            selected={parseDateValue(value)}
            onSelect={(date) => {
              if (date) {
                onChange(formatDateValue(date))
              }
              setOpen(false)
            }}
          />
        </PopoverContent>
      </Popover>
      <FieldErrorMessage message={error} />
    </div>
  )
}

function PositionSelect({
  value,
  options,
  disabledOptions,
  onChange,
  fieldPath,
  error,
}: PositionSelectProps) {
  const [open, setOpen] = useState(false)

  function handleSelect(option: string) {
    if (disabledOptions.includes(option)) {
      return
    }

    onChange(option)
    setOpen(false)
  }

  return (
    <div className="space-y-1.5">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            data-field={fieldPath}
            className={cn(
              "flex h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-[#c3c6d7] bg-white px-4 text-left text-base outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-400/20",
              value ? "text-[#191c1e]" : "text-[#737686]",
              error && "border-red-400 focus:border-red-400 focus:ring-red-200",
            )}
          >
            <span className="min-w-0 truncate">{value || "포지션 선택"}</span>
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
                  aria-disabled={isDisabled}
                  tabIndex={isDisabled ? -1 : undefined}
                  className={cn(
                    "flex h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-md px-3 text-left text-sm transition",
                    isSelected
                      ? "bg-blue-50 font-medium text-blue-500"
                      : isDisabled
                        ? "cursor-default bg-[#f7f9fb] text-[#9ca3af]"
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
      <FieldErrorMessage message={error} />
    </div>
  )
}

type TechStackOptionListProps = {
  inputValue: string
  options: readonly string[]
  selectedOptions: string[]
  onInputChange: (value: string) => void
  onInputKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void
  onToggle: (option: string) => void
  error?: string
}

function TechStackPicker({
  inputValue,
  options,
  selectedOptions,
  onInputChange,
  onInputKeyDown,
  onToggle,
  error,
}: TechStackOptionListProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-1.5">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Input
              value={inputValue}
              data-field="techStacks"
              aria-invalid={Boolean(error)}
              onChange={(event: ChangeEvent<HTMLInputElement>) => onInputChange(event.target.value)}
              onFocus={() => setOpen(true)}
              onClick={() => setOpen(true)}
              onKeyDown={onInputKeyDown}
              placeholder="기술 스택 검색 (예: Node.js, Python)"
              className={cn(
                "h-14 rounded-lg border-[#c3c6d7] bg-white pr-11 text-base focus:border-blue-400 focus:ring-blue-400/20 focus-visible:border-blue-400 focus-visible:ring-blue-400/20",
                error && "border-red-400 focus-visible:ring-red-200",
              )}
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
                      "flex h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-md px-3 text-left text-sm transition",
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
      <FieldErrorMessage message={error} />
    </div>
  )
}

type SelectFieldProps = {
  value: string
  options: readonly string[]
  placeholder: string
  onChange: (value: string) => void
  fieldPath?: string
  error?: string
}

function SelectField({ value, options, placeholder, onChange, fieldPath, error }: SelectFieldProps) {
  return (
    <div className="space-y-1.5">
      <div className="relative">
        <select
          value={value}
          data-field={fieldPath}
          aria-invalid={Boolean(error)}
          onChange={(event) => onChange(event.target.value)}
          className={cn(
            "h-14 w-full cursor-pointer appearance-none rounded-lg border border-[#c3c6d7] bg-white px-4 pr-11 text-base outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-400/20",
            value ? "text-[#191c1e]" : "text-[#737686]",
            error && "border-red-400 focus:border-red-400 focus:ring-red-200",
          )}
        >
          <option value="" disabled hidden>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-[#565e74]"
          aria-hidden="true"
        />
      </div>
      <FieldErrorMessage message={error} />
    </div>
  )
}

type GetPayloadOptions = {
  includePositionIds?: boolean
  clearEmptyThumbnail?: boolean
}

function getPayload(form: MeetingFormState, options: GetPayloadOptions = {}): MeetingUpsertPayload {
  const thumbnailUrl = form.thumbnailUrl.trim() || (options.clearEmptyThumbnail ? "" : null)

  return {
    title: form.title.trim(),
    category: form.category,
    description: form.description.trim(),
    additionalNotice: form.referenceNote.trim() || null,
    thumbnailUrl,
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

type PayloadValidationError = {
  message: string
  path: string
  fieldErrors: FieldErrors
}

function validatePayload(payload: MeetingUpsertPayload): PayloadValidationError | null {
  const validation = meetingPayloadSchema.safeParse(payload)

  if (!validation.success) {
    return getPayloadValidationError(validation.error.issues)
  }

  if (hasDuplicatePositionNames(payload.positions.map((position) => position.name))) {
    const duplicateIndex = payload.positions.findIndex((position, index) =>
      payload.positions.some((item, itemIndex) => itemIndex !== index && item.name === position.name),
    )
    const path = getPositionFieldPath(Math.max(duplicateIndex, 0), "name")

    return {
      message: "이미 선택한 포지션은 중복으로 추가할 수 없습니다.",
      path,
      fieldErrors: { [path]: "이미 선택한 포지션은 중복으로 추가할 수 없습니다." },
    }
  }

  return null
}

function getPayloadValidationError(issues: z.core.$ZodIssue[]): PayloadValidationError {
  const fieldErrors = issues.reduce<FieldErrors>((errors, issue) => {
    const path = getIssueFieldPath(issue.path)

    if (!errors[path]) {
      errors[path] = issue.message
    }

    return errors
  }, {})
  const firstPath = Object.keys(fieldErrors)[0] ?? "title"

  return {
    message: fieldErrors[firstPath] ?? "입력값을 확인해주세요.",
    path: firstPath,
    fieldErrors,
  }
}

function getIssueFieldPath(path: PropertyKey[]) {
  if (path[0] === "positions" && typeof path[1] === "number" && typeof path[2] === "string") {
    return getPositionFieldPath(path[1], path[2])
  }

  return String(path[0] ?? "title")
}

function getPositionFieldPath(index: number, field: PropertyKey) {
  return `positions.${index}.${String(field)}`
}

function getFormFieldValidationPath(field: keyof MeetingFormState) {
  if (field === "referenceNote") {
    return "additionalNotice"
  }

  return field
}

function focusField(path: string) {
  window.setTimeout(() => {
    const field = document.querySelector<HTMLElement>(`[data-field="${path}"]`)
    const target =
      field?.matches("input, textarea, select, button")
        ? field
        : field?.querySelector<HTMLElement>("input, textarea, select, button, [tabindex]")

    if (!field || !target) {
      return
    }

    field.scrollIntoView({ behavior: "smooth", block: "center" })
    target.focus({ preventScroll: true })
  }, 0)
}

function hasDuplicatePositionNames(names: string[]) {
  return new Set(names).size !== names.length
}

function getCompletion(form: MeetingFormState) {
  const checks = [
    form.title,
    form.category,
    form.deadline,
    form.startDate,
    form.expectedDuration,
    form.meetingSchedule,
    form.description,
    form.techStacks.length > 0,
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

function validateImageFile(file: File) {
  if (file.size > IMAGE_MAX_SIZE) {
    notify.error("이미지는 5MB 이하여야 합니다.")
    return false
  }

  if (!IMAGE_ACCEPT_TYPES.some((type) => type === file.type)) {
    notify.error("jpg/png/webp 형식만 업로드할 수 있습니다.")
    return false
  }

  return true
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

function formatDisplayDate(date: string) {
  if (!date) {
    return "선택"
  }

  const parsedDate = parseDateValue(date.slice(0, 10))

  if (!parsedDate) {
    return date
  }

  const year = parsedDate.getFullYear()
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0")
  const day = String(parsedDate.getDate()).padStart(2, "0")

  return `${year}.${month}.${day}`
}

function parseDateValue(value: string) {
  if (!value) {
    return undefined
  }

  const [year, month, day] = value.split("-").map(Number)

  if (!year || !month || !day) {
    return undefined
  }

  return new Date(year, month - 1, day)
}

function formatDateValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function getStableId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}
