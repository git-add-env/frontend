# UI Rules

이 문서는 컴포넌트 작성, 위치 기준, 스타일링, toast, 접근성 규칙을 정리합니다.

## 기본 원칙

- 기존 shadcn/ui 컴포넌트와 `components/ui`를 우선 사용합니다.
- 여러 화면에서 반복되는 UI는 `components/common`으로 분리합니다.
- 도메인 의미가 있는 UI는 해당 도메인 폴더에 둡니다.
- className 조합은 `cn()`을 사용합니다.
- 모바일과 데스크톱 레이아웃을 함께 고려합니다.
- 버튼, 입력, 다이얼로그에는 적절한 label, title, aria 속성을 사용합니다.

## 컴포넌트 위치

```txt
components/common/      # 여러 도메인에서 쓰는 공용 UI
components/dashboard/   # dashboard 전용 UI
components/meeting/     # meeting/meetings 도메인 전용 UI
components/mypage/      # mypage 전용 UI
components/providers/   # 전역 Provider
components/ui/          # shadcn/ui 기반 기본 UI
```

판단 기준:

- 특정 도메인의 데이터 타입이나 비즈니스 용어를 알면 도메인 폴더에 둡니다.
- Button, Dialog, Badge처럼 도메인 의미가 없으면 `components/ui`에 둡니다.
- 여러 도메인에서 같은 의미로 재사용되면 `components/common`에 둡니다.
- 한 페이지에서만 쓰는 작은 조각은 해당 도메인 컴포넌트 근처에 둡니다.

## page 파일

page 파일은 얇게 유지합니다.

page 파일이 담당하는 것:

- route params/search params 처리
- 서버에서 가능한 초기 데이터 조회
- 도메인 컴포넌트 렌더링
- 메타데이터 또는 레이아웃 경계

page 파일에 길게 두지 않는 것:

- 복잡한 UI 조합
- 긴 조건부 렌더링
- 클라이언트 이벤트 핸들러
- 반복되는 카드/리스트 UI
- 직접적인 백엔드 API 호출 로직

## 컴포넌트 작성 규칙

- props 타입은 컴포넌트 바로 위에 `type ComponentNameProps`로 선언합니다.
- props가 3개 이상이면 구조 분해 할당을 사용합니다.
- 복잡한 조건식은 JSX 안에 길게 쓰지 말고 위에서 변수로 분리합니다.
- 조건부 렌더링은 읽기 쉬운 변수명을 사용합니다.
- UI 조합이 길어지면 작은 컴포넌트로 분리합니다.
- React 컴포넌트는 named export를 사용합니다.

```tsx
type LoginDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  function handleClose() {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Button onClick={handleClose}>닫기</Button>
    </Dialog>
  )
}
```

## 클라이언트 컴포넌트

다음이 필요한 파일에만 `"use client"`를 붙입니다.

- `useState`, `useEffect` 같은 React client hook
- event handler
- 브라우저 API
- `useSession`, React Query hook
- Zustand store hook

서버에서 처리 가능한 데이터 조회는 서버 컴포넌트 또는 서버 함수에서 처리합니다.

## 스타일링

- Tailwind class는 기존 패턴을 우선 따릅니다.
- 조건부 class 조합은 `cn()`을 사용합니다.
- 임의 색상과 임의 spacing을 남발하지 않습니다.
- 공통 spacing, radius, border, text style은 기존 UI와 맞춥니다.
- 카드 안에 또 다른 장식용 카드를 중첩하지 않습니다.
- 텍스트가 버튼이나 카드 영역을 넘치지 않도록 모바일 폭을 확인합니다.

```tsx
<Button className={cn("w-full", isActive && "bg-primary")}>
  저장
</Button>
```

## 상태 UI

API를 사용하는 화면은 가능한 범위에서 다음 상태를 함께 처리합니다.

- loading
- error
- empty
- success
- disabled
- submitting

사용자 액션 중에는 버튼 중복 클릭을 막고, 완료/실패 결과를 알려줍니다.

## Toast

toast는 `sonner`를 직접 import하지 않고 `@/lib/notify`의 `notify` helper를 사용합니다.

```ts
import { notify } from "@/lib/notify"

notify.success("저장되었습니다.")
notify.error("저장에 실패했습니다.")
notify.info("안내 메시지")
notify.warning("확인이 필요합니다.")
```

로딩 toast를 갱신할 때는 반환된 id를 재사용합니다.

```ts
const toastId = notify.loading("처리 중입니다.")

try {
  await action()
  notify.success("완료되었습니다.", { id: toastId })
} catch {
  notify.error("실패했습니다.", { id: toastId })
}
```

Promise 기반 작업은 `notify.promise`를 사용할 수 있습니다.

```ts
notify.promise(createMeeting(payload), {
  loading: "모임을 만드는 중입니다.",
  success: "모임이 생성되었습니다.",
  error: "모임 생성에 실패했습니다.",
})
```

OAuth처럼 redirect가 있는 로그인 흐름은 버튼 클릭 지점에서 성공 toast를 띄우지 않습니다.
복귀 후 세션 감지 로직에서 알림을 처리합니다.

## 접근성

- 버튼은 실제 `<button>` 또는 shadcn `Button`을 사용합니다.
- 아이콘 버튼에는 `aria-label` 또는 `title`을 제공합니다.
- Dialog, Popover 등은 shadcn/Radix 컴포넌트를 우선 사용합니다.
- 입력 요소에는 label 또는 접근 가능한 이름을 제공합니다.
- 비활성 버튼은 이유가 필요하면 주변 문구나 tooltip으로 설명합니다.
- 색상만으로 상태를 구분하지 않습니다.

## 전역 Provider

전역 provider는 `app/layout.tsx`에서 연결합니다.

- `AuthProvider`: NextAuth 세션 제공
- `QueryProvider`: TanStack Query 제공
- `ThemeProvider`: 테마 제공
- `ToastProvider`: shadcn sonner 전역 Toaster 및 인증 알림 이벤트 제공

새 전역 기능을 추가할 때는 provider 순서와 클라이언트/서버 컴포넌트 경계를 확인합니다.

## Constants와 옵션 데이터

화면에서 사용하는 고정 옵션 pool은 컴포넌트 안에 직접 선언하지 않고 `constants/`에 둡니다.

- 옵션 배열은 `as const`로 고정합니다.
- 필요한 경우 union type을 함께 export합니다.
- API payload나 validation에서 같은 옵션이 필요하면 같은 constants 파일을 재사용합니다.

```ts
export const ONBOARDING_JOB_OPTIONS = [
  "프론트엔드 개발자",
  "백엔드 개발자",
] as const

export type OnboardingJob = (typeof ONBOARDING_JOB_OPTIONS)[number]
```
